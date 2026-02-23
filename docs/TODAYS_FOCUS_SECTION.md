# "Today's Focus" Section Documentation

## Overview

The "Today's Focus" header marks the primary interactive area of the HabitFlow application.

---

## Purpose & Functionality

### Main Task List

It acts as the container title for the user's daily habits. Everything below this heading represents the actions the user needs to focus on for the current day (`todayStr`).

### Dynamic Habit Counter

Right next to the text, there is a dynamic badge (`{habits.length} total`) that automatically updates to show the total number of active habits currently managed in the app's state.

### Container Context

In the broader layout (the left column of the grid), this heading introduces the section where users can:

- See their list of habits or an empty state message if none exist.
- Interact with individual habits (marking them as done, deleting them).

---

## Implementation Details

**Component Location:** `frontend/src/pages/Dashboard.jsx`

### Key Code Structure

```
jsx
// Section Header
<h3 className="text-xl font-bold flex items-center gap-2">
  Today's Focus
  <span className="text-xs font-normal bg-white/5 px-2 py-0.5 rounded text-slate-400">{habits.length} total</span>
</h3>
```

### Date Variable

The `todayStr` is dynamically generated and represents the current day:

```
jsx
const today = new Date();
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const todayStr = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;
```

### Empty State

When no habits exist, the following message is displayed:

```
jsx
{habits.length === 0 ? (
  <div className="glass-card p-8 rounded-xl text-center">
    <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">add_circle</span>
    <p className="text-slate-400">No habits yet. Add your first habit to get started!</p>
  </div>
) : (
  /* Habit list mapping */
)}
```

### Habit Interactions

- **Mark as Done**: Click the circular button on the habit card to toggle completion
- **Delete**: Hover over the habit card to reveal the delete button
