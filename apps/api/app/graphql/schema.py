from datetime import datetime

import strawberry
from sqlalchemy import or_, select
from strawberry.types import Info

from app.db.models import Place, PlacePhoto, Trip
from app.db.session import SessionLocal
from app.graphql.types import (
    GeocodeResultType,
    PlacePhotoType,
    PlaceType,
    TripType,
    UploadInitType,
    UserType,
)
from app.services.auth import RequestUser, authenticate
from app.services.geocoding import geocode
from app.services.storage import create_presigned_put_url, generate_owner_key, head_object, validate_upload_request


def _require_user(info: Info) -> RequestUser:
    auth_header = info.context["request"].headers.get("Authorization")
    return authenticate(auth_header)


def _trip_to_type(trip: Trip) -> TripType:
    return TripType(
        id=str(trip.id),
        owner_id=str(trip.owner_id),
        title=trip.title,
        description=trip.description,
        visibility=trip.visibility,
        created_at=trip.created_at.isoformat(),
    )


def _photo_to_type(photo: PlacePhoto) -> PlacePhotoType:
    return PlacePhotoType(
        id=str(photo.id),
        place_id=str(photo.place_id),
        r2_key=photo.r2_key,
        mime=photo.mime,
        width=photo.width,
        height=photo.height,
        exif_lat=photo.exif_lat,
        exif_lng=photo.exif_lng,
        exif_taken_at=photo.exif_taken_at.isoformat() if photo.exif_taken_at else None,
        created_at=photo.created_at.isoformat(),
    )


def _place_to_type(place: Place) -> PlaceType:
    return PlaceType(
        id=str(place.id),
        trip_id=str(place.trip_id),
        lat=place.lat,
        lng=place.lng,
        title=place.title,
        notes=place.notes,
        visited_at=place.visited_at.isoformat() if place.visited_at else None,
        created_at=place.created_at.isoformat(),
        photos=[_photo_to_type(p) for p in place.photos if p.deleted_at is None],
    )


@strawberry.type
class Query:
    @strawberry.field
    def me(self, info: Info) -> UserType:
        user = _require_user(info)
        return UserType(
            id=user.id,
            clerk_user_id=user.clerk_user_id,
            email=user.email,
            display_name=user.display_name,
        )

    @strawberry.field
    def my_trips(self, info: Info) -> list[TripType]:
        user = _require_user(info)
        with SessionLocal() as session:
            rows = session.scalars(select(Trip).where(Trip.owner_id == user.id).order_by(Trip.created_at.desc())).all()
            return [_trip_to_type(r) for r in rows]

    @strawberry.field
    def trip_places(self, info: Info, trip_id: str, search: str | None = None) -> list[PlaceType]:
        user = _require_user(info)
        with SessionLocal() as session:
            trip = session.scalar(select(Trip).where(Trip.id == trip_id))
            if not trip or str(trip.owner_id) != user.id:
                raise PermissionError("Trip not found")

            query = select(Place).where(Place.trip_id == trip_id).order_by(Place.created_at.desc())
            if search:
                pattern = f"%{search}%"
                query = query.where(or_(Place.title.ilike(pattern), Place.notes.ilike(pattern)))
            rows = session.scalars(query).all()
            return [_place_to_type(r) for r in rows]

    @strawberry.field
    def geocode(self, info: Info, query: str) -> list[GeocodeResultType]:
        _require_user(info)
        payload = geocode(query)
        return [
            GeocodeResultType(
                display_name=item.get("display_name", ""),
                lat=float(item.get("lat", 0)),
                lng=float(item.get("lon", 0)),
            )
            for item in payload
        ]


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_trip(self, info: Info, title: str, description: str | None = None, visibility: str = "private") -> TripType:
        user = _require_user(info)
        with SessionLocal() as session:
            trip = Trip(owner_id=user.id, title=title, description=description, visibility=visibility)
            session.add(trip)
            session.commit()
            session.refresh(trip)
            return _trip_to_type(trip)

    @strawberry.mutation
    def create_place(
        self,
        info: Info,
        trip_id: str,
        title: str,
        lat: float,
        lng: float,
        notes: str | None = None,
        visited_at_iso: str | None = None,
    ) -> PlaceType:
        user = _require_user(info)
        visited_at = datetime.fromisoformat(visited_at_iso) if visited_at_iso else None
        with SessionLocal() as session:
            trip = session.scalar(select(Trip).where(Trip.id == trip_id))
            if not trip or str(trip.owner_id) != user.id:
                raise PermissionError("Trip not found")
            place = Place(trip_id=trip_id, title=title, lat=lat, lng=lng, notes=notes, visited_at=visited_at)
            session.add(place)
            session.commit()
            session.refresh(place)
            return _place_to_type(place)

    @strawberry.mutation
    def init_upload(self, info: Info, mime: str, size_bytes: int, ext: str = "jpg") -> UploadInitType:
        user = _require_user(info)
        validate_upload_request(mime=mime, size_bytes=size_bytes)
        key = generate_owner_key(owner_id=user.id, ext=ext)
        url = create_presigned_put_url(key=key, mime=mime)
        return UploadInitType(key=key, presigned_url=url)

    @strawberry.mutation
    def complete_upload(
        self,
        info: Info,
        place_id: str,
        key: str,
        mime: str,
        width: int | None = None,
        height: int | None = None,
        exif_lat: float | None = None,
        exif_lng: float | None = None,
        exif_taken_at_iso: str | None = None,
    ) -> PlacePhotoType:
        user = _require_user(info)
        if not key.startswith(f"user/{user.id}/"):
            raise PermissionError("Invalid owner key prefix")
        object_meta = head_object(key)
        content_type = object_meta.get("ContentType")
        if content_type and content_type != mime:
            raise ValueError("Mime mismatch")
        exif_taken_at = datetime.fromisoformat(exif_taken_at_iso) if exif_taken_at_iso else None

        with SessionLocal() as session:
            place = session.scalar(select(Place).join(Trip).where(Place.id == place_id, Trip.owner_id == user.id))
            if not place:
                raise PermissionError("Place not found")
            photo = PlacePhoto(
                place_id=place_id,
                owner_id=user.id,
                r2_key=key,
                mime=mime,
                width=width,
                height=height,
                exif_lat=exif_lat,
                exif_lng=exif_lng,
                exif_taken_at=exif_taken_at,
            )
            session.add(photo)
            session.commit()
            session.refresh(photo)
            return _photo_to_type(photo)

    @strawberry.mutation
    def soft_delete_photo(self, info: Info, photo_id: str) -> bool:
        user = _require_user(info)
        with SessionLocal() as session:
            photo = session.scalar(
                select(PlacePhoto).join(Place).join(Trip).where(PlacePhoto.id == photo_id, Trip.owner_id == user.id)
            )
            if not photo:
                return False
            photo.deleted_at = datetime.utcnow()
            session.add(photo)
            session.commit()
            return True


schema = strawberry.Schema(query=Query, mutation=Mutation)
