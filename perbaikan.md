Fix the document analysis pipeline issue in TeamDynamics.

Focus files:

* backend/routers/document.py
* backend/services/document_service.py
* backend/services/simulation_engine.py

Current issues:

* AI extraction misses some roster members from uploaded PDF/DOCX files.
* Personality traits are incomplete or skipped.
* active_roster is not fully synced with extracted roster data.
* Existing roster state may be merged incorrectly instead of replaced.

Expected behavior:

* Extract ALL roster members from the document.
* Extract complete personality traits for every member.
* Apply extracted roster directly into active_roster.
* Replace old roster state instead of merging/extending it.
* Validate extraction before applying setup.

Required fixes:

1. Improve PDF/document parsing reliability.
2. Add strict schema + roster count validation.
3. Retry extraction automatically if members are missing.
4. Prevent silent skipping of incomplete members.
5. Add debug logging for extraction and roster synchronization.

The uploaded document must become the single source of truth for simulation setup.
