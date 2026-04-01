import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:scifionly/ui/screens/person_detail_screen.dart';
import 'package:scifionly/providers/providers.dart';
import 'package:scifionly/models/person_detail.dart';
import 'package:scifionly/models/person.dart';
import 'package:scifionly/ui/theme/app_theme.dart';
import '../fixtures/sample_data.dart';

void main() {
  Widget buildScreen(List<Override> overrides, {int personId = 1}) {
    return ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        theme: AppTheme.darkTheme(),
        home: PersonDetailScreen(personId: personId),
      ),
    );
  }

  List<Override> withData() => [
        personDetailProvider(1)
            .overrideWith((ref) async => samplePersonDetail),
      ];

  group('PersonDetailScreen', () {
    testWidgets('renders profile image placeholder', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      // The profile image has a ClipOval
      expect(find.byType(ClipOval), findsOneWidget);
    });

    testWidgets('renders person name', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Keanu Reeves'), findsOneWidget);
    });

    testWidgets('renders known for department', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Acting'), findsOneWidget);
    });

    testWidgets('renders movie credits', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Movies'), findsOneWidget);
      expect(find.text('(1)'), findsOneWidget);
      expect(find.text('The Matrix'), findsOneWidget);
    });

    testWidgets('renders credit subtitle with character and year',
        (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.textContaining('Neo'), findsOneWidget);
    });

    testWidgets('shows "Person not found" when data is null', (tester) async {
      await tester.pumpWidget(buildScreen([
        personDetailProvider(999).overrideWith((ref) async => null),
      ], personId: 999));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Person not found'), findsOneWidget);
    });

    testWidgets('shows error state', (tester) async {
      await tester.pumpWidget(buildScreen([
        personDetailProvider(1)
            .overrideWith((ref) async => throw Exception('Test error')),
      ]));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.textContaining('Error'), findsOneWidget);
    });

    testWidgets('shows "No credits found" when empty', (tester) async {
      const emptyPersonDetail = PersonDetail(
        person: Person(
          id: 99,
          tmdbId: 9999,
          name: 'Unknown Actor',
          knownForDepartment: 'Acting',
        ),
        movieCredits: [],
        tvCredits: [],
      );
      await tester.pumpWidget(buildScreen([
        personDetailProvider(99)
            .overrideWith((ref) async => emptyPersonDetail),
      ], personId: 99));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('No credits found'), findsOneWidget);
    });

    testWidgets('renders TV credits section', (tester) async {
      const personWithTvCredits = PersonDetail(
        person: samplePerson,
        movieCredits: [],
        tvCredits: [
          Credit(
            contentId: 1,
            tmdbId: 1399,
            title: 'The Expanse',
            releaseDate: '2015-12-14',
            character: 'Test Character',
            role: 'cast',
            mediaType: 'tv',
          ),
        ],
      );
      await tester.pumpWidget(buildScreen([
        personDetailProvider(1)
            .overrideWith((ref) async => personWithTvCredits),
      ]));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('TV Series'), findsOneWidget);
      expect(find.text('(1)'), findsOneWidget);
      expect(find.text('The Expanse'), findsOneWidget);
    });

    testWidgets('renders back button', (tester) async {
      await tester.pumpWidget(buildScreen(withData()));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.byIcon(Icons.arrow_back), findsOneWidget);
    });

    testWidgets('renders person with crew credits (job field)',
        (tester) async {
      const personWithCrewCredits = PersonDetail(
        person: Person(
          id: 5,
          tmdbId: 2710,
          name: 'James Cameron',
          knownForDepartment: 'Directing',
        ),
        movieCredits: [
          Credit(
            contentId: 1,
            tmdbId: 218,
            title: 'The Terminator',
            releaseDate: '1984-10-26',
            job: 'Director',
            role: 'crew',
            mediaType: 'movie',
          ),
        ],
        tvCredits: [],
      );
      await tester.pumpWidget(buildScreen([
        personDetailProvider(5)
            .overrideWith((ref) async => personWithCrewCredits),
      ], personId: 5));
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('James Cameron'), findsOneWidget);
      expect(find.text('Directing'), findsOneWidget);
      expect(find.text('The Terminator'), findsOneWidget);
    });
  });
}
