I'll review this correction systematically. Let me start by reading the spec, the implementation, and the tests.<tool_call>
<function=task>
<parameter=description>Review spec docs</parameter>
<parameter=subagent_type>explore</parameter>
<parameter=prompt>Read ALL files under /home/fall_out_bug/projects/sdp/portolan/docs/specs/052-dependency-symbol-evidence-import/ completely. Return the full content of every file found. This is a spec directory for a code review.</parameter>
</function>
</tool_call><tool_call>
<function=task>
<parameter=description>Review implementation code</parameter>
<parameter=subagent_type>explore</parameter>
<parameter=prompt>Read the following files completely and return their full contents:
1. /home/fall_out_bug/projects/sdp/portolan/internal/contextprep/contextprep.go
2. /home/fall_out_bug/projects/sdp/portolan/internal/app/app_test.go

These are Go source files for a code review. Return the complete file contents.</parameter>
</function>
</tool_call><tool_call>
<function=task>
<parameter=description>Review stress run output</parameter>
<parameter=subagent_type>explore</parameter>
<parameter=prompt>Explore the directory /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/ and read key output files. Specifically:
1. List all files in this directory tree
2. Read evidence-index.jsonl (or evidence-index.json) if present - look for relationship-candidate records
3. Read agent-brief.md if present
4. Read answer-contract.md if present
5. Read query-plan.md if present

Return the full contents of each file found.</parameter>
</function>
</tool_call>
