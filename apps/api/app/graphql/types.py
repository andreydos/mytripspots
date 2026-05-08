import strawberry


@strawberry.type
class UserType:
    id: str
    clerk_user_id: str
    email: str | None
    display_name: str | None


@strawberry.type
class TripType:
    id: str
    owner_id: str
    title: str
    description: str | None
    visibility: str
    created_at: str


@strawberry.type
class PlacePhotoType:
    id: str
    place_id: str
    r2_key: str
    mime: str
    width: int | None
    height: int | None
    exif_lat: float | None
    exif_lng: float | None
    exif_taken_at: str | None
    created_at: str


@strawberry.type
class PlaceType:
    id: str
    trip_id: str
    lat: float
    lng: float
    title: str
    notes: str | None
    visited_at: str | None
    created_at: str
    photos: list[PlacePhotoType]


@strawberry.type
class UploadInitType:
    key: str
    presigned_url: str


@strawberry.type
class GeocodeResultType:
    display_name: str
    lat: float
    lng: float
