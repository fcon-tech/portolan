# Internal App Test Fixtures

This directory holds package-local copies for `internal/app` tests that execute
from the package working directory. These fixtures are not product examples or
supported catalogs.

Prefer `internal/testfixtures/` for new shared CLI fixtures. Add package-local
fixtures here only when the package test needs relative paths or isolated
fixtures that should not become part of the shared CLI fixture set.
