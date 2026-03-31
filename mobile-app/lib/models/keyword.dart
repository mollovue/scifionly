class Keyword {
  final int id;
  final String name;

  const Keyword({required this.id, required this.name});

  factory Keyword.fromMap(Map<String, dynamic> map) {
    return Keyword(
      id: map['id'] as int,
      name: map['name'] as String,
    );
  }
}
