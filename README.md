# HAIT_Consultants

Its an Enquiry & Schedule Manager which is a full-stack application built with **Next.js + TypeScript** on the frontend and **Node.js + JavaScript** on the backend, using **Prisma ORM** with **PostgreSQL** for database management.
The system streamlines how enquiries are tracked, updated, and converted into scheduled sessions, while also offering built-in timezone conversion and availability checking.

---

## 📌 Overview

This application is designed to make enquiry handling and scheduling effortless. You start by adding enquiries into the system, and as their status changes—like moving from *pending* to *confirmed* or *delivered*—the system automatically transfers those enquiries into the scheduling module.

The goal is to provide a smooth workflow where users no longer have to manually maintain two separate places for enquiries and schedules.

---

## 🔄 Enquiry → Schedule Automation

When an enquiry is created, it remains in the enquiry list until its status is updated.
Once a user marks it as **Confirmed** or **Delivered**, the system:

* Copies all relevant details
* Automatically inserts it into the schedule
* Prevents duplicate scheduling
* Ensures smooth tracking of upcoming sessions

This eliminates manual effort and reduces errors between enquiry handling and session scheduling.

---

## 🌍 Timezone Conversion (IST → Any Timezone)

The application includes a dedicated feature for converting session timings from **IST** to any global timezone.
This helps when:

* Coordinating with international clients
* Planning cross-region events
* Avoiding manual timezone conversion mistakes

Users can input a date/time in IST, select the target timezone, and instantly get the converted timing.

---

## 🗓️ Availability Checker

One of the core features of the project is the session availability algorithm.

You enter:

* A date
* Start time
* End time

The system then scans all existing scheduled sessions to determine:

* Whether a conflict exists
* If the requested time range overlaps with another session
* Or if the slot is completely free

This helps prevent double-booking and makes scheduling highly reliable.

---

## ✔️ What This Project Solves

* Centralizes enquiry and scheduling in one place
* Automates the transition from enquiry to schedule
* Prevents session clashes with a conflict-detection algorithm
* Handles timezone conversions cleanly
* Makes the whole process intuitive for both admins and users

---

## 🛠️ Tech Summary

* **Frontend:** Next.js + TypeScript
* **Backend:** Node.js + JavaScript
* **ORM:** Prisma
* **Database:** PostgreSQL

---

If you want, I can also create:

* A short intro version for your GitHub
* A highly polished version with emojis, badges, and screenshots
* A version written in a more formal/enterprise tone

