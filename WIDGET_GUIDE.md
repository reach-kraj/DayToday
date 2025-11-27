# Native Widget Implementation Guide

This guide explains how to implement native home-screen widgets for **DayToday** on iOS and Android. 

> **Note**: This requires "ejecting" from the Expo Managed workflow to the Bare workflow (or using Prebuild).

## 1. Eject / Prebuild
Run the following command to generate the native directories (`android` and `ios`):
```bash
npx expo prebuild
```

## 2. Shared Data Strategy
To share data between the React Native app and the Native Widgets, we will use **App Groups** (iOS) and **Shared Preferences / File Storage** (Android).
The React Native app will write a JSON file containing today's tasks to a shared location whenever the data changes.

### JSON Schema
The shared file `today_tasks.json` will look like this:
```json
[
  {
    "id": "uuid-1",
    "title": "Morning Standup",
    "completed": false,
    "time": "10:00 AM"
  },
  {
    "id": "uuid-2",
    "title": "Code Review",
    "completed": true,
    "time": "11:00 AM"
  }
]
```

---

## 3. iOS Widget (WidgetKit)

### Step 3.1: Add Widget Extension
1. Open `ios/DayToday.xcworkspace` in Xcode.
2. Go to **File > New > Target**.
3. Select **Widget Extension**.
4. Name it `DayTodayWidget`.
5. Uncheck "Include Configuration Intent" (unless you want configurable widgets).

### Step 3.2: Configure App Group
1. Select the main app target (`DayToday`) -> **Signing & Capabilities** -> **+ Capability** -> **App Groups**.
2. Create a new group, e.g., `group.com.yourname.daytoday`.
3. Select the `DayTodayWidget` target and add the **same** App Group.

### Step 3.3: Swift Implementation
Replace the contents of `DayTodayWidget.swift` with:

```swift
import WidgetKit
import SwiftUI

struct TaskEntry: TimelineEntry, Decodable {
    let date: Date
    let id: String
    let title: String
    let completed: Bool
}

struct TaskModel: Decodable {
    let id: String
    let title: String
    let completed: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), tasks: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), tasks: loadTasks())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let tasks = loadTasks()
        let entry = SimpleEntry(date: Date(), tasks: tasks)
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    func loadTasks() -> [TaskModel] {
        let fileManager = FileManager.default
        // Replace with your App Group ID
        if let url = fileManager.containerURL(forSecurityApplicationGroupIdentifier: "group.com.yourname.daytoday")?.appendingPathComponent("today_tasks.json") {
            if let data = try? Data(contentsOf: url) {
                let decoder = JSONDecoder()
                if let tasks = try? decoder.decode([TaskModel].self, from: data) {
                    return tasks
                }
            }
        }
        return []
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let tasks: [TaskModel]
}

struct DayTodayWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading) {
            Text("Today's Tasks")
                .font(.headline)
                .padding(.bottom, 4)
            
            if entry.tasks.isEmpty {
                Text("No tasks pending")
                    .font(.caption)
                    .foregroundColor(.gray)
            } else {
                ForEach(entry.tasks.prefix(3), id: \.id) { task in
                    HStack {
                        Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(task.completed ? .green : .gray)
                        Text(task.title)
                            .font(.caption)
                            .strikethrough(task.completed)
                    }
                }
            }
            Spacer()
        }
        .padding()
    }
}

@main
struct DayTodayWidget: Widget {
    let kind: String = "DayTodayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DayTodayWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("DayToday Tasks")
        .description("View your daily tasks.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

### Step 3.4: Writing from React Native (iOS)
You need to use `expo-file-system` to write to the App Group container.
*Note: `expo-file-system` doesn't directly support App Groups out of the box easily without native code or a config plugin. A simpler way in Bare workflow is to write a small Native Module.*

**Native Module (Swift):**
Create `SharedStorage.swift` in your main app target:
```swift
import Foundation

@objc(SharedStorage)
class SharedStorage: NSObject {
  @objc(set:withResolver:rejecter:)
  func set(data: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let url = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.yourname.daytoday")?.appendingPathComponent("today_tasks.json") {
      do {
        try data.write(to: url, atomically: true, encoding: .utf8)
        // Reload widget
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        resolve(true)
      } catch {
        reject("ERROR", "Failed to write", error)
      }
    }
  }
}
```

---

## 4. Android Widget (AppWidget)

### Step 4.1: Create Widget Files
In `android/app/src/main/java/com/yourname/daytoday/`:

**DayTodayWidget.kt**:
```kotlin
package com.yourname.daytoday

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import org.json.JSONArray
import java.io.File

class DayTodayWidget : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
}

internal fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
    val views = RemoteViews(context.packageName, R.layout.day_today_widget)
    
    // Read JSON
    val file = File(context.filesDir, "today_tasks.json")
    if (file.exists()) {
        val jsonStr = file.readText()
        val jsonArray = JSONArray(jsonStr)
        // Simple example: just showing the first task title
        if (jsonArray.length() > 0) {
            val task = jsonArray.getJSONObject(0)
            views.setTextViewText(R.id.appwidget_text, task.getString("title"))
        } else {
            views.setTextViewText(R.id.appwidget_text, "No tasks")
        }
    } else {
        views.setTextViewText(R.id.appwidget_text, "No data")
    }

    appWidgetManager.updateAppWidget(appWidgetId, views)
}
```

### Step 4.2: Layout
Create `android/app/src/main/res/layout/day_today_widget.xml`:
```xml
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="@dimen/widget_margin"
    android:background="#FFFFFF">

    <TextView
        android:id="@+id/appwidget_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_centerHorizontal="true"
        android:layout_centerVertical="true"
        android:text="Loading..."
        android:textColor="#000000"
        android:textSize="16sp"
        android:textStyle="bold" />
</RelativeLayout>
```

### Step 4.3: Manifest
Add to `AndroidManifest.xml`:
```xml
<receiver android:name=".DayTodayWidget" android:exported="false">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/day_today_widget_info" />
</receiver>
```

### Step 4.4: Widget Info
Create `android/app/src/main/res/xml/day_today_widget_info.xml`:
```xml
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="40dp"
    android:minHeight="40dp"
    android:updatePeriodMillis="86400000"
    android:initialLayout="@layout/day_today_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen">
</appwidget-provider>
```

### Step 4.5: Writing from React Native (Android)
Use `react-native-fs` or a simple Native Module to write to `context.getFilesDir() + "/today_tasks.json"`. Then send a broadcast intent to update the widget.
