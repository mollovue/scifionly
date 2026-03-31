import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/ui/components/cast_card.dart';
import '../fixtures/sample_data.dart';
import '../helpers/test_helpers.dart';

void main() {
  group('CastCard', () {
    testWidgets('shows name', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        CastCard(
          member: sampleCastMember,
          onTap: () {},
        ),
      ));
      expect(find.text('Keanu Reeves'), findsOneWidget);
    });

    testWidgets('shows character name', (tester) async {
      await tester.pumpWidget(wrapWithTheme(
        CastCard(
          member: sampleCastMember,
          onTap: () {},
        ),
      ));
      expect(find.text('Neo'), findsOneWidget);
    });

    testWidgets('tap callback is invoked', (tester) async {
      bool tapped = false;
      await tester.pumpWidget(wrapWithTheme(
        CastCard(
          member: sampleCastMember,
          onTap: () => tapped = true,
        ),
      ));
      await tester.tap(find.text('Keanu Reeves'));
      expect(tapped, true);
    });
  });
}
