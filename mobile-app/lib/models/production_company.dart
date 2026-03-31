class ProductionCompany {
  final int id;
  final String name;
  final String? logoPath;
  final String? originCountry;

  const ProductionCompany({
    required this.id,
    required this.name,
    this.logoPath,
    this.originCountry,
  });

  factory ProductionCompany.fromMap(Map<String, dynamic> map) {
    return ProductionCompany(
      id: map['id'] as int,
      name: map['name'] as String,
      logoPath: map['logo_path'] as String?,
      originCountry: map['origin_country'] as String?,
    );
  }
}
