# Toggle_ERD

```dbml
Table users {
  id bigint [pk, increment]
  email varchar [not null, unique]
  password varchar [not null]
  nickname varchar [not null]
  role varchar [not null, note: 'USER, OWNER, ADMIN (Guest is not persisted)']
  profile_image_url varchar
  status varchar [not null, default: 'ACTIVE', note: 'ACTIVE, INACTIVE, BLOCKED']
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Table store_categories {
  id bigint [pk, increment]
  name varchar [not null, unique]
  created_at timestamp [not null]
}

Table stores {
  id bigint [pk, increment]
  owner_id bigint [not null, ref: > users.id]
  category_id bigint [not null, ref: > store_categories.id]
  name varchar [not null]
  description text
  phone varchar
  address varchar [not null]
  latitude decimal(10, 7) [not null]
  longitude decimal(10, 7) [not null]
  business_status varchar [not null, default: 'CLOSED', note: 'OPEN, BREAK_TIME, CLOSED, TEMP_CLOSED, EARLY_CLOSED']
  is_verified boolean [not null, default: false]
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Table store_status_logs {
  id bigint [pk, increment]
  store_id bigint [not null, ref: > stores.id]
  changed_by bigint [not null, ref: > users.id]
  previous_status varchar [note: 'OPEN, BREAK_TIME, CLOSED, TEMP_CLOSED, EARLY_CLOSED']
  new_status varchar [not null, note: 'OPEN, BREAK_TIME, CLOSED, TEMP_CLOSED, EARLY_CLOSED']
  memo varchar
  changed_at timestamp [not null]
}

Table favorites {
  id bigint [pk, increment]
  user_id bigint [not null, ref: > users.id]
  store_id bigint [not null, ref: > stores.id]
  created_at timestamp [not null]

  indexes {
    (user_id, store_id) [unique]
  }
}

Table saved_place_categories {
  id bigint [pk, increment]
  user_id bigint [not null, ref: > users.id]
  name varchar [not null]
  created_at timestamp [not null]

  indexes {
    (user_id, name) [unique]
  }
}

Table saved_places {
  id bigint [pk, increment]
  user_id bigint [not null, ref: > users.id]
  store_id bigint [not null, ref: > stores.id]
  category_id bigint [ref: > saved_place_categories.id]
  custom_name varchar
  memo text
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Table maps {
  id bigint [pk, increment]
  user_id bigint [not null, ref: > users.id]
  title varchar [not null]
  description text
  visibility varchar [not null, default: 'PRIVATE', note: 'PRIVATE, PUBLIC']
  created_at timestamp [not null]
  updated_at timestamp [not null]
}

Table map_stores {
  id bigint [pk, increment]
  map_id bigint [not null, ref: > maps.id]
  store_id bigint [not null, ref: > stores.id]
  memo text
  sort_order int [default: 0]
  created_at timestamp [not null]

  indexes {
    (map_id, store_id) [unique]
  }
}

Table reports {
  id bigint [pk, increment]
  reporter_id bigint [not null, ref: > users.id]
  target_type varchar [not null, note: 'STORE, MAP, USER']
  target_id bigint [not null]
  reason varchar [not null]
  detail text
  report_status varchar [not null, default: 'PENDING', note: 'PENDING, REVIEWED, REJECTED, RESOLVED']
  handled_by bigint [ref: > users.id]
  handled_at timestamp
  created_at timestamp [not null]
}
