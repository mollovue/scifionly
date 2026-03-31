import 'package:flutter_test/flutter_test.dart';
import 'package:scifionly/features/sync/sync_engine.dart';

void main() {
  group('SyncEngine static helpers', () {
    group('daysBetween', () {
      test('returns 0 for same date', () {
        expect(SyncEngine.daysBetween('2026-03-30', '2026-03-30'), 0);
      });

      test('returns 1 for one day apart', () {
        expect(SyncEngine.daysBetween('2026-03-30', '2026-03-31'), 1);
      });

      test('returns 14 for two weeks', () {
        expect(SyncEngine.daysBetween('2026-03-01', '2026-03-15'), 14);
      });

      test('returns 30 for month difference', () {
        expect(SyncEngine.daysBetween('2026-03-01', '2026-03-31'), 30);
      });
    });

    group('addDays', () {
      test('adds positive days', () {
        expect(SyncEngine.addDays('2026-03-30', 1), '2026-03-31');
      });

      test('adds negative days', () {
        expect(SyncEngine.addDays('2026-03-30', -14), '2026-03-16');
      });

      test('crosses month boundary', () {
        expect(SyncEngine.addDays('2026-03-30', 5), '2026-04-04');
      });

      test('adds zero days', () {
        expect(SyncEngine.addDays('2026-03-30', 0), '2026-03-30');
      });
    });

    group('splitDateRange', () {
      test('single chunk for range <= maxDays', () {
        final chunks =
            SyncEngine.splitDateRange('2026-03-01', '2026-03-10', 14);
        expect(chunks.length, 1);
        expect(chunks[0][0], '2026-03-01');
        expect(chunks[0][1], '2026-03-10');
      });

      test('splits into two chunks for range just over maxDays', () {
        final chunks =
            SyncEngine.splitDateRange('2026-03-01', '2026-03-20', 14);
        expect(chunks.length, 2);
        expect(chunks[0][0], '2026-03-01');
        expect(chunks[0][1], '2026-03-15');
        expect(chunks[1][0], '2026-03-15');
        expect(chunks[1][1], '2026-03-20');
      });

      test('splits into three chunks for large range', () {
        final chunks =
            SyncEngine.splitDateRange('2026-01-01', '2026-02-15', 14);
        expect(chunks.length, greaterThanOrEqualTo(3));
        // First chunk starts at start date
        expect(chunks.first[0], '2026-01-01');
        // Last chunk ends at end date
        expect(chunks.last[1], '2026-02-15');
      });

      test('handles exact maxDays range', () {
        final chunks =
            SyncEngine.splitDateRange('2026-03-01', '2026-03-15', 14);
        expect(chunks.length, 1);
        expect(chunks[0][0], '2026-03-01');
        expect(chunks[0][1], '2026-03-15');
      });

      test('returns empty for same start and end', () {
        final chunks =
            SyncEngine.splitDateRange('2026-03-01', '2026-03-01', 14);
        expect(chunks, isEmpty);
      });
    });

    group('todayUtc', () {
      test('returns date in YYYY-MM-DD format', () {
        final today = SyncEngine.todayUtc();
        expect(today, matches(RegExp(r'^\d{4}-\d{2}-\d{2}$')));
      });
    });
  });

  group('Genre filtering logic', () {
    test('movie sci-fi genre is 878', () {
      final genres = [
        {'id': 28, 'name': 'Action'},
        {'id': 878, 'name': 'Science Fiction'},
      ];
      final isSciFi = genres.any((g) => g['id'] == 878);
      expect(isSciFi, isTrue);
    });

    test('movie without genre 878 is not sci-fi', () {
      final genres = [
        {'id': 28, 'name': 'Action'},
        {'id': 12, 'name': 'Adventure'},
      ];
      final isSciFi = genres.any((g) => g['id'] == 878);
      expect(isSciFi, isFalse);
    });

    test('TV sci-fi genre is 10765', () {
      final genres = [
        {'id': 10765, 'name': 'Sci-Fi & Fantasy'},
        {'id': 18, 'name': 'Drama'},
      ];
      final isSciFi = genres.any((g) => g['id'] == 10765);
      expect(isSciFi, isTrue);
    });

    test('TV without genre 10765 is not sci-fi', () {
      final genres = [
        {'id': 18, 'name': 'Drama'},
        {'id': 80, 'name': 'Crime'},
      ];
      final isSciFi = genres.any((g) => g['id'] == 10765);
      expect(isSciFi, isFalse);
    });

    test('empty genres list is not sci-fi', () {
      final genres = <Map<String, dynamic>>[];
      final isSciFi = genres.any((g) => g['id'] == 878);
      expect(isSciFi, isFalse);
    });
  });
}
