class CrewMember {
  final int personId;
  final String name;
  final String? profilePath;
  final String? job;
  final String? department;

  const CrewMember({
    required this.personId,
    required this.name,
    this.profilePath,
    this.job,
    this.department,
  });

  factory CrewMember.fromMap(Map<String, dynamic> map) {
    return CrewMember(
      personId: map['person_id'] as int,
      name: map['name'] as String,
      profilePath: map['profile_path'] as String?,
      job: map['job'] as String?,
      department: map['department'] as String?,
    );
  }
}
