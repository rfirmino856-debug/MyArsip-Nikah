import * as migration_20261006_141932_add_archive_nikah_collection from './20261006_141932_add_archive_nikah_collection';

export const migrations = [
  {
    up: migration_20261006_141932_add_archive_nikah_collection.up,
    down: migration_20261006_141932_add_archive_nikah_collection.down,
    name: '20261006_141932_add_archive_nikah_collection'
  },
];
