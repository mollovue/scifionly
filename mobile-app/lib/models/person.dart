class Person {
  final int id;
  final int tmdbId;
  final String name;
  final String? profilePath;
  final String? knownForDepartment;

  const Person({
    required this.id,
    required this.tmdbId,
    required this.name,
    this.profilePath,
    this.knownForDepartment,
  });

  factory Person.fromMap(Map<String, dynamic> map) {
    return Person(
      id: map['id'] as int,
      tmdbId: map['tmdb_id'] as int,
      name: map['name'] as String,
      profilePath: map['profile_path'] as String?,
      knownForDepartment: map['known_for_department'] as String?,
    );
  }
}
