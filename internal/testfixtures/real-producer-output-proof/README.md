Fixtures for spec 054 producer-run records.

The happy-path records are templated with `__PORTOLAN_TEST_ROOT__` because the
producer-run contract requires an absolute target root and verified records must
point to real local output files. Tests replace the token with a temporary root
before validation.
