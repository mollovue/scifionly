class CastMember {
  final int personId;
  final String name;
  final String? profilePath;
  final String? character;
  final int? displayOrder;

  const CastMember({
    required this.personId,
    required this.name,
    this.profilePath,
    this.character,
    this.displayOrder,
  });

  factory CastMember.fromMap(Map<String, dynamic> map) {
    return CastMember(
      personId: map['person_id'] as int,
      name: map['name'] as String,
      profilePath: map['profile_path'] as String?,
      character: map['character'] as String?,
      displayOrder: map['display_order'] as int?,
    );
  }
}
