# Quickstart: Bigtop Architecture Understanding

1. Confirm the active branch:

   ```bash
   git status --short --branch
   ```

2. Confirm Bigtop evidence inputs:

   ```bash
   sed -n '1,120p' /home/fall_out_bug/projects/bigtop-landscape/.portolan/producer-runs.jsonl
   sed -n '1,160p' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-054-initial-proof/context/agent-brief.md
   ```

3. Run Cursor-only and Cursor-plus-Portolan prompts from `stress/`.

4. Score answers in `reviews/architecture-understanding-ledger-YYYY-MM-DD.md`.

5. Keep Bigtop runtime topology `blocked` or `not_assessed` unless a safe local
   runtime observation export is selected and produces `runtime-visible`
   evidence.
