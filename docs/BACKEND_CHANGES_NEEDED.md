# Backend Changes Needed — Play Count Inflation Bug

> [!SUCCESS]
> **RESOLVED**: These changes have been successfully implemented in `AndroidBridge.kt`, `StatsDatabaseHelper.kt`, and `AudioPlayerBar.tsx`. This document is retained for historical context.

**Reported by:** Frontend review of `phone/android` + `phone/frontend`
**Affected files:** `StatsDatabaseHelper.kt`, `AndroidBridge.kt`
**Severity:** High — user-visible incorrect stat on the Library screen

---

## The bug

`StatsDatabaseHelper.updateStats()` currently increments `play_count` by 1 on
**every call**, but the frontend calls `updateStats(filename, secondsDelta)`
roughly every 5 seconds during playback (by design, so listen-time isn't lost
if the app crashes or the user force-quits mid-session).

```kotlin
// current implementation — StatsDatabaseHelper.kt
fun updateStats(filename: String, timeListened: Int) {
    ...
    values.put(COLUMN_PLAY_COUNT, playCount + 1)          // <-- increments every call
    values.put(COLUMN_TOTAL_TIME, totalTime + timeListened)
    ...
}
```

**Result:** a single continuous 10-minute play is recorded as ~120 "plays"
instead of 1. This number is shown directly to the user in
`LibraryScreen.tsx` ("Played N times"), so it's not just an internal metric —
it's visibly wrong.

---

## Requested fix

Split "record a play" and "record listen-time" into two separate bridge
calls.

### 1. New method: `recordPlayStart`

Add to `AndroidBridge.kt`:

```kotlin
@JavascriptInterface
fun recordPlayStart(filename: String) {
    dbHelper.recordPlayStart(filename)
}
```

Add to `StatsDatabaseHelper.kt`:

```kotlin
fun recordPlayStart(filename: String) {
    val db = this.writableDatabase
    val cursor = db.rawQuery("SELECT * FROM $TABLE_STATS WHERE $COLUMN_FILENAME=?", arrayOf(filename))

    if (cursor.moveToFirst()) {
        val playCount = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_PLAY_COUNT))
        val values = ContentValues()
        values.put(COLUMN_PLAY_COUNT, playCount + 1)
        db.update(TABLE_STATS, values, "$COLUMN_FILENAME=?", arrayOf(filename))
    } else {
        val values = ContentValues()
        values.put(COLUMN_FILENAME, filename)
        values.put(COLUMN_PLAY_COUNT, 1)
        values.put(COLUMN_TOTAL_TIME, 0)
        db.insert(TABLE_STATS, null, values)
    }
    cursor.close()
}
```

This should only ever be called once per playback session (track start),
so it's the only place `play_count` gets incremented.

### 2. Update `updateStats` to stop touching `play_count`

```kotlin
fun updateStats(filename: String, timeListened: Int) {
    val db = this.writableDatabase
    val cursor = db.rawQuery("SELECT * FROM $TABLE_STATS WHERE $COLUMN_FILENAME=?", arrayOf(filename))

    if (cursor.moveToFirst()) {
        val totalTime = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_TOTAL_TIME))
        val values = ContentValues()
        values.put(COLUMN_TOTAL_TIME, totalTime + timeListened)
        db.update(TABLE_STATS, values, "$COLUMN_FILENAME=?", arrayOf(filename))
    } else {
        // Row shouldn't normally be missing here since recordPlayStart runs first,
        // but insert defensively without fabricating a play count.
        val values = ContentValues()
        values.put(COLUMN_FILENAME, filename)
        values.put(COLUMN_PLAY_COUNT, 0)
        values.put(COLUMN_TOTAL_TIME, timeListened)
        db.insert(TABLE_STATS, null, values)
    }
    cursor.close()
}
```

`updateStats` should now **only** ever modify `total_time_seconds`.

---

## Contract with frontend

- Method name/signature to confirm: `recordPlayStart(filename: String): Unit`,
  exposed as `@JavascriptInterface` on `AndroidBridge`, matching
  `updateStats`'s existing pattern (fire-and-forget, no return value).
- Frontend (`androidBridge.ts` / `AudioPlayerBar.tsx`) will call
  `recordPlayStart(filename)` exactly once when a track starts playing, and
  will continue calling `updateStats(filename, secondsDelta)` periodically
  for listen-time only.
- If the final method name differs from `recordPlayStart`, please let the
  frontend team know before merging so the JS-side interface declaration and
  call site stay in sync.

---

## Not required, but worth confirming with backend

- `getAllStats()` / `getStats()` JSON shape (`filename`, `playCount`,
  `totalTime`) is unchanged and already matches what the frontend expects —
  no changes needed there.
