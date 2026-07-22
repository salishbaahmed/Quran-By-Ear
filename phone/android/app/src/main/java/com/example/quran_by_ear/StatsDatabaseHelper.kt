package com.example.quran_by_ear

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

class StatsDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_VERSION = 1
        private const val DATABASE_NAME = "AudioStats.db"
        const val TABLE_STATS = "stats"
        const val COLUMN_FILENAME = "filename"
        const val COLUMN_PLAY_COUNT = "play_count"
        const val COLUMN_TOTAL_TIME = "total_time_seconds"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createTable = ("CREATE TABLE " + TABLE_STATS + "("
                + COLUMN_FILENAME + " TEXT PRIMARY KEY,"
                + COLUMN_PLAY_COUNT + " INTEGER,"
                + COLUMN_TOTAL_TIME + " INTEGER" + ")")
        db.execSQL(createTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_STATS)
        onCreate(db)
    }

    fun updateStats(filename: String, timeListened: Int) {
        val db = this.writableDatabase
        
        val cursor = db.rawQuery("SELECT * FROM $TABLE_STATS WHERE $COLUMN_FILENAME=?", arrayOf(filename))
        
        if (cursor.moveToFirst()) {
            val totalTime = cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_TOTAL_TIME))
            
            val values = ContentValues()
            values.put(COLUMN_TOTAL_TIME, totalTime + timeListened)
            
            db.update(TABLE_STATS, values, "$COLUMN_FILENAME=?", arrayOf(filename))
        } else {
            val values = ContentValues()
            values.put(COLUMN_FILENAME, filename)
            values.put(COLUMN_PLAY_COUNT, 0)
            values.put(COLUMN_TOTAL_TIME, timeListened)
            db.insert(TABLE_STATS, null, values)
        }
        cursor.close()
    }

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

    fun getStats(filename: String): JSONObject {
        val db = this.readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_STATS WHERE $COLUMN_FILENAME=?", arrayOf(filename))
        val obj = JSONObject()
        
        if (cursor.moveToFirst()) {
            obj.put("filename", filename)
            obj.put("playCount", cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_PLAY_COUNT)))
            obj.put("totalTime", cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_TOTAL_TIME)))
        } else {
            obj.put("filename", filename)
            obj.put("playCount", 0)
            obj.put("totalTime", 0)
        }
        cursor.close()
        return obj
    }

    fun getAllStats(): JSONArray {
        val db = this.readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_STATS", null)
        val arr = JSONArray()
        
        if (cursor.moveToFirst()) {
            do {
                val obj = JSONObject()
                obj.put("filename", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_FILENAME)))
                obj.put("playCount", cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_PLAY_COUNT)))
                obj.put("totalTime", cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_TOTAL_TIME)))
                arr.put(obj)
            } while (cursor.moveToNext())
        }
        cursor.close()
        return arr
    }

    fun deleteStats(filename: String) {
        val db = this.writableDatabase
        db.delete(TABLE_STATS, "$COLUMN_FILENAME=?", arrayOf(filename))
    }
}
