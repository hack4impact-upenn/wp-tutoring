# CP-SAT Matching Schema Contract (Phase 1)

This file defines the canonical fields required by the upcoming OR-Tools CP-SAT matcher.
Existing frontend-compatible fields are still preserved for backward compatibility.

## Tutor document contract (`tutorApplications`)

- `maxCapacity` (int, default `1`)
- `gradePrefs` (list[str], default derived from `ageRanges`)
- `subjectList` (list[str], default `subjects`)
- `availability` (list[{day, time}])
- `tutorGender` (str, default `"Unknown"`)
- `apIbReady` (bool, default `False`)
- `returningStudentIds` (list[str], default `[]`)

Legacy fields retained:
- `firstName`, `lastName`, `email`, `pennId`, `year`, `format`, `subjects`, `ageRanges`, ...

## Tutee document contract (`tuteeApplications`)

- `requiredTutorId` (str | null, default `null`)
- `preferredTutorId` (str | null, default `null`)
- `familyId` (str | null, default `null`)
- `requiredGender` (str, default `"Any"`)
- `returningStatus` (str, one of `none | preferred | required`, default `none`)
- `subjectNeeds` (list[str], default `subjects`)
- `grade` (str, default `studentGrade`)
- `availability` (list[{day, time}])
- `preferredTimeSlots` (list[{day, time}], default `[]`)

Legacy fields retained:
- `studentFirstName`, `studentLastName`, `studentGrade`, `subjects`, `genderPreference`, ...

## Defaulting behavior for old records

On read (`GET /api/tutors`, `GET /api/tutees`, and lookups), the API backfills missing canonical fields in-memory:

- Tutor:
  - `maxCapacity = 1`
  - `tutorGender = "Unknown"`
  - `apIbReady = False`
  - `returningStudentIds = []`
  - `subjectList = subjects`
  - `gradePrefs = ageRanges -> grade bands`

- Tutee:
  - `requiredTutorId = null`
  - `preferredTutorId = null`
  - `familyId = null`
  - `requiredGender = "Any"`
  - `returningStatus = "none"`
  - `subjectNeeds = subjects`
  - `grade = studentGrade`
  - `preferredTimeSlots = []`

## Validation behavior in API payloads

- `maxCapacity` is validated as integer >= 1.
- Canonical fields are optional for clients (safe defaults are applied).
- Existing required submit fields remain unchanged.
