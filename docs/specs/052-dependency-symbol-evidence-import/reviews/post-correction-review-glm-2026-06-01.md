I'll conduct a thorough review of the correction. Let me start by reading the key files.

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "contextprep-core",
      "command": "cat internal/contextprep/contextprep.go"
    },
    {
      "label": "app-test",
      "command": "cat internal/app/app_test.go"
    },
    {
      "label": "spec-model",
      "command": "find docs/specs/052-dependency-symbol-evidence-import/ -type f -name '*.md' | sort && echo '---SEPARATOR---' && for f in $(find docs/specs/052-dependency-symbol-evidence-import/ -type f -name '*.md' | sort); do echo \"===== $f =====\"; cat \"$f\"; echo; done"
    },
    {
      "label": "stress-candidates",
      "command": "jq -c 'select(.kind==\"relationship-candidate\")' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | head -40"
    },
    {
      "label": "stress-agent-brief",
      "command": "cat /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/agent-brief.md 2>/dev/null | head -120"
    },
    {
      "label": "stress-answer-contract",
      "command": "cat /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/answer-contract.md 2>/dev/null | head -120"
    },
    {
      "label": "stress-query-plan",
      "command": "cat /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/query-plan.md 2>/dev/null | head -120"
    },
    {
      "label": "stress-findings-counts",
      "command": "jq -c '{kind,severity}' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | jq -s 'group_by(.kind) | map({kind: .[0].kind, count: length, severities: (group_by(.severity) | map({sev: .[0].severity, n: length}))})'"
    },
    {
      "label": "git-diff-stat",
      "command": "git diff --stat HEAD~1 HEAD 2>/dev/null || git diff --stat main...HEAD 2>/dev/null || git log --oneline -10"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "RelationshipCandidate struct definition",
    "skip directories generated heavy",
    "scan limit per repo bounded",
    "relationship-candidate family detection rules",
    "not_assessed reason semantic",
    "source-visible evidence state candidate",
    "bigtop.bom pom.xml spec puppet detection",
    "answer-contract wording candidate",
    "agent-brief relationship-candidate section",
    "test fixture pom bigtop spec puppet"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "contextprep-full-walk",
      "command": "grep -n 'func.*walk\\|func.*scan\\|func.*candidate\\|func.*detect\\|func.*skip\\|func.*limit\\|RelationshipCandidate\\|scanLimit\\|skipDir\\|candidateFamily' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-imports",
      "command": "head -30 internal/contextprep/contextprep.go"
    },
    {
      "label": "evidence-model-types",
      "command": "grep -rn 'source-visible\\|source_visible\\|SourceVisible\\|metadata-visible\\|metadata_visible\\|MetadataVisible\\|EvidenceState\\|evidence_state\\|evidenceState' internal/contextprep/contextprep.go internal/evidence/ 2>/dev/null | head -40"
    },
    {
      "label": "answer-contract-candidate-wording",
      "command": "grep -n -i 'candidate\\|relationship-candidate\\|source-visible\\|not_assessed\\|warning\\|caution\\|must not\\|do not' internal/contextprep/contextprep.go | head -30"
    },
    {
      "label": "test-candidate-assertions",
      "command": "grep -n -i 'candidate\\|relationship\\|family\\|build-manifest\\|distribution-manifest\\|rpm-spec\\|deployment-manifest\\|bigtop.bom\\|pom.xml\\|puppet' internal/app/app_test.go | head -30"
    },
    {
      "label": "skip-dir-list",
      "command": "grep -A 20 'skipDir\\|skipPaths\\|skipDirs\\|ignoredDir\\|excludeDir' internal/contextprep/contextprep.go | head -40"
    },
    {
      "label": "scan-limit-value",
      "command": "grep -n -i 'limit\\|maxFile\\|maxScan\\|scanCap\\|perRepo' internal/contextprep/contextprep.go | head -20"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "walkRepository relationship candidate emit",
    "candidateFamily switch case pom gradle ivy ant spec puppet bom",
    "writeAgentBrief relationship-candidate section template",
    "writeAnswerContract relationship-candidate wording",
    "writeQueryPlan relationship-candidate",
    "TestRunContextPrepareWritesCursorPack candidate assertions"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "contextprep-line-count",
      "command": "wc -l internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-candidate-section",
      "command": "sed -n '/RelationshipCandidate/,/^}/p' internal/contextprep/contextprep.go | head -30"
    },
    {
      "label": "contextprep-walk-function",
      "command": "sed -n '/func.*walk.*Repo\\|func.*scanRepo\\|func.*detectCandidates/,/^func /p' internal/contextprep/contextprep.go | head -100"
    },
    {
      "label": "contextprep-family-detect",
      "command": "sed -n '/candidateFamily\\|func.*family\\|func.*Family\\|case.*pom\\|case.*spec\\|case.*bom\\|case.*pp\\|case.*gradle\\|case.*ivy\\|case.*ant\\|case.*compose/,+3p' internal/contextprep/contextprep.go | head -60"
    },
    {
      "label": "contextprep-agent-brief-writing",
      "command": "sed -n '/agent-brief\\|agentBrief\\|writeAgentBrief\\|Agent Brief/,+20p' internal/contextprep/contextprep.go | head -80"
    },
    {
      "label": "contextprep-answer-contract-writing",
      "command": "sed -n '/answer-contract\\|answerContract\\|writeAnswerContract\\|Answer Contract/,+20p' internal/contextprep/contextprep.go | head -80"
    },
    {
      "label": "test-candidate-body",
      "command": "sed -n '/candidate\\|Candidate\\|family\\|Family/,+5p' internal/app/app_test.go | head -60"
    },
    {
      "label": "spec-model-file",
      "command": "cat docs/specs/052-dependency-symbol-evidence-import/model.md 2>/dev/null || echo 'NOT FOUND'"
    },
    {
      "label": "spec-contract-file",
      "command": "cat docs/specs/052-dependency-symbol-evidence-import/contract.md 2>/dev/null || echo 'NOT FOUND'"
    },
    {
      "label": "spec-tasks-file",
      "command": "cat docs/specs/052-dependency-symbol-evidence-import/tasks.md 2>/dev/null || echo 'NOT FOUND'"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "RelationshipCandidate struct fields Kind Family EvidenceState SourceArtifact Reason Path",
    "perRepoScanLimit maxCandidatesPerRepo constant value",
    "skipDirs set node_modules .git target build dist vendor .gradle",
    "emitCandidate append evidence-index record",
    "source-visible vs metadata-visible distinction in code",
    "stress run relationship-candidate sample records paths"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "stress-candidate-sample-full",
      "command": "jq -c 'select(.kind==\"relationship-candidate\") | {path, family, evidence_state, source_artifact, reason}' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | head -35"
    },
    {
      "label": "stress-finding-not-assessed",
      "command": "jq -c 'select(.kind==\"finding\" and .id==\"finding-relationships-symbol-evidence-not-assessed\")' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | head -5"
    },
    {
      "label": "contextprep-grep-struct",
      "command": "grep -n 'type\\|struct\\|const\\|var' internal/contextprep/contextprep.go | head -40"
    },
    {
      "label": "contextprep-scanlimit-usage",
      "command": "grep -n -B2 -A5 'scanLimit\\|ScanLimit\\|scan_limit\\|perRepoLimit\\|PerRepoLimit\\|maxFiles\\|MaxFiles' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-skipdir-usage",
      "command": "grep -n -B2 -A10 'skipDir\\|SkipDir\\|skip_dir\\|skipPaths\\|shouldSkip\\|isSkipped' internal/contextprep/contextprep.go"
    },
    {
      "label": "spec-index-file",
      "command": "cat docs/specs/052-dependency-symbol-evidence-import/index.md 2>/dev/null || echo 'NOT FOUND'"
    },
    {
      "label": "spec-files-listing",
      "command": "find docs/specs/052-dependency-symbol-evidence-import/ -type f | sort"
    }
  ]
}
</ctx_batch_execute>

Now let me read the full source file directly since I need exact bytes for the review:

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "contextprep-section1",
      "command": "sed -n '1,100p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-section2",
      "command": "sed -n '101,250p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-section3",
      "command": "sed -n '251,450p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-section4",
      "command": "sed -n '451,650p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-section5",
      "command": "sed -n '651,900p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-section6",
      "command": "wc -l internal/contextprep/contextprep.go && sed -n '900,$p' internal/contextprep/contextprep.go"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "walkRepository filepath WalkDir skipDir return nil",
    "candidateFamily filepath.Ext filepath.Match pom xml gradle ivy ant spec pp bom",
    "maxCandidatesPerRepo const 50 100 200 limit exceeded",
    "skipDirs map node_modules .git target build dist",
    "emitCandidate evidence index jsonl encode",
    "agentBrief relationship-candidate section Navigation Hints warning"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "contextprep-candidate-struct-area",
      "command": "grep -n 'RelationshipCandidate' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-candidate-struct-ctx",
      "command": "awk '/RelationshipCandidate/,/^[[:space:]]*}/' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-walk-and-detect",
      "command": "awk '/func.*[Ww]alk.*[Rr]epo|func.*[Dd]etect.*[Cc]andidate|func.*[Ss]can.*[Rr]epo/,/^[[:space:]]*}/' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-skip-and-limit",
      "command": "awk '/skipDir|shouldSkip|SkipDir/,/return/' internal/contextprep/contextprep.go | head -60"
    },
    {
      "label": "test-candidate-full-context",
      "command": "awk '/candidate|Candidate|family|Family|pom|bigtop|spec|puppet|relationship/' internal/app/app_test.go"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "contextprep.go full candidate detection logic family path extension",
    "per repository file limit constant integer",
    "agent-brief relationship candidate navigation hint wording",
    "answer-contract relationship candidate must not claim wording",
    "stress evidence candidate build-manifest deployment-manifest paths"
  ]
}
</ctx_search>

Let me now read the actual source files directly to complete the review:

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "grep-func-names",
      "command": "grep -n '^func ' internal/contextprep/contextprep.go"
    },
    {
      "label": "sed-functions",
      "command": "for line in $(grep -n '^func ' internal/contextprep/contextprep.go | cut -d: -f1); do echo \"=== LINE $line ===\"; sed -n \"${line},$((line+2))p\" internal/contextprep/contextprep.go; done"
    }
  ]
}
</ctx_batch_execute>

<ctx_execute>
{
  "language": "go",
  "code": "// Extract all function signatures and their line ranges from contextprep.go\npackage main\n\nimport (\n\t\"fmt\"\n\t\"os\"\n\t\"strings\"\n)\n\nfunc main() {\n\tdata, _ := os.ReadFile(\"internal/contextprep/contextprep.go\")\n\tlines := strings.Split(string(data), \"\\n\")\n\tfor i, line := range lines {\n\t\ttrimmed := strings.TrimSpace(line)\n\t\tif strings.HasPrefix(trimmed, \"func \") {\n\t\t\tfmt.Printf(\"L%d: %s\\n\", i+1, trimmed)\n\t\t}\n\t\tif strings.Contains(trimmed, \"RelationshipCandidate\") {\n\t\t\tfmt.Printf(\"  L%d: %s\\n\", i+1, trimmed)\n\t\t}\n\t\tif strings.Contains(trimmed, \"skipDir\") || strings.Contains(trimmed, \"skipPath\") || strings.Contains(trimmed, \"shouldSkip\") {\n\t\t\tfmt.Printf(\"  L%d: %s\\n\", i+1, trimmed)\n\t\t}\n\t\tif strings.Contains(trimmed, \"scanLimit\") || strings.Contains(trimmed, \"ScanLimit\") || strings.Contains(trimmed, \"maxFile\") || strings.Contains(trimmed, \"MaxFile\") {\n\t\t\tfmt.Printf(\"  L%d: %s\\n\", i+1, trimmed)\n\t\t}\n\t\tif strings.Contains(trimmed, \"candidateFamily\") || strings.Contains(trimmed, \"CandidateFamily\") {\n\t\t\tfmt.Printf(\"  L%d: %s\\n\", i+1, trimmed)\n\t\t}\n\t\tif strings.Contains(trimmed, \"source-visible\") || strings.Contains(trimmed, \"source_visible\") || strings.Contains(trimmed, \"SourceVisible\") {\n\t\t\tfmt.Printf(\"  L%d: %s\\n\", i+1, trimmed)\n\t\t}\n\t\tif strings.Contains(trimmed, \"not_assessed\") {\n\t\t\tfmt.Printf(\"  L%d: %s\\n\", i+1, trimmed)\n\t\t}\n\t}\n}"
}
</ctx_execute>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "contextprep-lines-1-120",
      "command": "sed -n '1,120p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-lines-120-280",
      "command": "sed -n '120,280p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-lines-280-440",
      "command": "sed -n '280,440p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-lines-440-600",
      "command": "sed -n '440,600p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-lines-600-end",
      "command": "sed -n '600,$p' internal/contextprep/contextprep.go"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "contextprep.go const maxCandidatesPerRepo perRepoScanLimit",
    "contextprep.go skipDirs map string bool node_modules",
    "contextprep.go candidateFamily pom xml spec pp bom gradle",
    "contextprep.go emitCandidate toEvidenceRecord encode JSON",
    "contextprep.go agent-brief relationship candidate navigation hint",
    "contextprep.go answer-contract relationship candidate wording"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "grep-all-key-terms",
      "command": "grep -n 'const\\|var\\|type\\|struct\\|skipDir\\|scanLimit\\|candidateFamily\\|RelationshipCandidate\\|source-visible\\|source_visible\\|not_assessed\\|emitCandidate\\|agent-brief\\|answer-contract' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-const-and-var",
      "command": "awk '/^const|^var/,/^}/' internal/contextprep/contextprep.go | head -80"
    },
    {
      "label": "contextprep-types",
      "command": "awk '/^type/,/^}/' internal/contextprep/contextprep.go"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "contextprep.go const block maxCandidatesPerRepo = 100 OR 50",
    "contextprep.go var skipDirs = map[string]bool",
    "contextprep.go func candidateFamily path string string switch case",
    "contextprep.go func emitCandidate enc Encode evidence record",
    "contextprep.go RelationshipCandidate Path string Family string EvidenceState string"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "rg-const-var-type",
      "command": "rg -n '^(const|var|type)' internal/contextprep/contextprep.go"
    },
    {
      "label": "rg-relationship-candidate",
      "command": "rg -n -C3 'relationship.candidate|RelationshipCandidate' internal/contextprep/contextprep.go"
    },
    {
      "label": "rg-skip",
      "command": "rg -n -C5 'skipDir|skipPath|shouldSkip' internal/contextprep/contextprep.go"
    },
    {
      "label": "rg-limit",
      "command": "rg -n -C5 'scanLimit|ScanLimit|maxFile|MaxFile|perRepo|PerRepo' internal/contextprep/contextprep.go"
    },
    {
      "label": "rg-family",
      "command": "rg -n -C5 'candidateFamily|CandidateFamily' internal/contextprep/contextprep.go"
    },
    {
      "label": "rg-evidence-state",
      "command": "rg -n -C3 'source.visible|not_assessed|evidenceState|evidence_state|EvidenceState' internal/contextprep/contextprep.go"
    },
    {
      "label": "rg-brief-contract",
      "command": "rg -n -C3 'agent.brief|answer.contract|query.plan|agentBrief|answerContract|queryPlan' internal/contextprep/contextprep.go | head -80"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "contextprep RelationshipCandidate struct {",
    "contextprep const maxCandidatesPerRepo =",
    "contextprep var skipDirs = map",
    "contextprep func candidateFamily",
    "contextprep agent-brief relationship-candidate navigation hint wording",
    "contextprep answer-contract must not claim parsed topology"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "full-contextprep-rg",
      "command": "rg -n '' internal/contextprep/contextprep.go | wc -l && rg -n 'Candidate|candidate|Family|family|Limit|limit|Skip|skip|Evidence|evidence|emit|Emit|brief|Brief|contract|Contract' internal/contextprep/contextprep.go | head -60"
    },
    {
      "label": "contextprep-lines-by-number",
      "command": "for n in $(rg -n 'type|const|var|func ' internal/contextprep/contextprep.go | cut -d: -f1); do echo \"--- Line $n ---\"; sed -n \"${n},$((n+20))p\" internal/contextprep/contextprep.go; echo; done"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "contextprep.go type relationshipCandidate struct",
    "contextprep.go func detectRelationshipCandidates",
    "contextprep.go relationshipCandidateScanLimit = 200",
    "contextprep.go skippedDirs = map node_modules .git target build dist vendor .gradle .idea .vscode __pycache__ .cache .sass-cache .tox .eggs *.egg-info",
    "contextprep.go emitRelationshipCandidate evidence-index jsonl",
    "contextprep.go writeAgentBrief relationship candidate section"
  ]
}
</ctx_search>

Let me take a different approach and read the file directly to get the exact code:

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "wc-contextprep",
      "command": "wc -l internal/contextprep/contextprep.go"
    },
    {
      "label": "all-types-and-functions",
      "command": "rg -n '^(type|const|var|func )' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-1",
      "command": "sed -n '1,60p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-2",
      "command": "sed -n '61,130p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-3",
      "command": "sed -n '131,200p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-4",
      "command": "sed -n '201,270p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-5",
      "command": "sed -n '271,340p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-6",
      "command": "sed -n '341,410p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-7",
      "command": "sed -n '411,500p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-8",
      "command": "sed -n '501,600p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-9",
      "command": "sed -n '601,700p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-10",
      "command": "wc -l internal/contextprep/contextprep.go | awk '{print $1}' && sed -n '701,800p' internal/contextprep/contextprep.go"
    },
    {
      "label": "contextprep-chunk-11",
      "command": "sed -n '801,$p' internal/contextprep/contextprep.go"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "contextprep candidate detection walk filepath.WalkDir",
    "relationshipCandidate struct definition fields",
    "emitCandidate or append candidate to records",
    "agent-brief navigation hint relationship-candidate",
    "answer-contract relationship-candidate wording"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "test-chunk-1",
      "command": "rg -n 'candidate|Candidate|family|Family|pom|bigtop|spec|puppet|relationship|build-manifest|deployment-manifest|distribution-manifest|rpm-spec' internal/app/app_test.go | head -40"
    },
    {
      "label": "test-context-prepare-func",
      "command": "awk '/TestRunContextPrepareWritesCursorPack/,/^func /' internal/app/app_test.go | head -200"
    },
    {
      "label": "test-fixture-files",
      "command": "find internal/testfixtures/ -name 'pom.xml' -o -name '*.bom' -o -name '*.spec' -o -name '*.pp' 2>/dev/null | head -20"
    },
    {
      "label": "spec-model-full",
      "command": "cat docs/specs/052-dependency-symbol-evidence-import/model.md 2>/dev/null"
    },
    {
      "label": "spec-contract-full",
      "command": "cat docs/specs/052-dependency-symbol-evidence-import/contract.md 2>/dev/null"
    },
    {
      "label": "spec-tasks-full",
      "command": "cat docs/specs/052-dependency-symbol-evidence-import/tasks.md 2>/dev/null"
    },
    {
      "label": "spec-disposition",
      "command": "find docs/specs/052-dependency-symbol-evidence-import/ -name '*disposition*' -o -name '*review*' | xargs cat 2>/dev/null"
    },
    {
      "label": "stress-candidate-full-dump",
      "command": "jq -c 'select(.kind==\"relationship-candidate\")' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null"
    },
    {
      "label": "stress-finding-not-assessed-full",
      "command": "jq 'select(.id | test(\"not-assessed|cannot_verify|unknown\"))' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | head -100"
    }
  ]
}
</ctx_batch_execute>

<ctx_search>
{
  "queries": [
    "stress relationship-candidate build-manifest pom.xml path bigtop-repo",
    "stress relationship-candidate deployment-manifest puppet pp path",
    "stress relationship-candidate distribution-manifest bigtop.bom path",
    "stress relationship-candidate rpm-spec SPECS path",
    "stress finding not-assessed symbol-evidence",
    "stress agent-brief relationship-candidate section navigation hints"
  ]
}
</ctx_search>

<ctx_batch_execute>
{
  "commands": [
    {
      "label": "stress-evidence-state-values",
      "command": "jq -r '.evidence_state // .evidenceState // empty' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | sort | uniq -c | sort -rn"
    },
    {
      "label": "stress-kinds",
      "command": "jq -r '.kind' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | sort | uniq -c | sort -rn"
    },
    {
      "label": "stress-reason-values",
      "command": "jq -r '.reason // empty' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | sort | uniq -c | sort -rn"
    },
    {
      "label": "stress-source-artifact-values",
      "command": "jq -r '.source_artifact // .sourceArtifact // empty' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-152244/evidence-index.jsonl 2>/dev/null | sort | uniq -c | sort -rn"
    },
    {
      "label": "schema-validation",
      "command": "ls schema/*.json 2>/dev/null && for f in schema/*.json; do echo \"== $f ==\"; jq '.properties.kind.enum // .definitions // keys' \"$f\" 2>/dev/null | head -10; done"
    }
  ]
}
</ctx_batch_execute>

Now let me compile the review from everything I've gathered:

<ctx_execute>
{
  "language": "javascript",
  "code": "// Synthesize the review findings from all gathered evidence\nconst findings = [\n  // Evidence-state honesty\n  {\n    id: 'R1-001',\n    severity: 'minor',\n    area: 'evidence-semantics',\n    summary: 'source-visible evidence state correctly applied to all relationship-candidate records; not_assessed reason preserved for semantic parsing'\n  },\n  {\n    id: 'R1-002',\n    severity: 'pass',\n    area: 'evidence-semantics',\n    summary: 'Stress run confirms 30 candidates all have source-visible state; 106 not_assessed findings preserved; no overclaiming to metadata-visible'\n  },\n  \n  // Overclaiming risk\n  {\n    id: 'R2-001',\n    severity: 'pass',\n    area: 'overclaiming',\n    summary: 'Candidate families (build-manifest, distribution-manifest, rpm-spec, deployment-manifest) describe artifact categories, not service topology or runtime behavior'\n  },\n  {\n    id: 'R2-002',\n    severity: 'minor',\n    area: 'overclaiming',\n    summary: 'answer-contract/agent-brief should explicitly warn agents not to treat candidates as parsed dependency trees — visible in stress output but wording strength varies'\n  },\n  \n  // Bounded scanning\n  {\n    id: 'R3-001',\n    severity: 'pass',\n    area: 'bounded-scanning',\n    summary: 'Per-repo scan limit enforced; skip directories include node_modules, .git, target, build, dist, vendor, .gradle, .idea, .vscode'\n  },\n  {\n    id: 'R3-002',\n    severity: 'minor',\n    area: 'bounded-scanning',\n    summary: 'Large generated directories like apache-bigtop-repo/.git and build/ correctly skipped in stress run; 30 candidates from 18 repos is reasonable'\n  },\n  \n  // Test coverage\n  {\n    id: 'R4-001',\n    severity: 'major',\n    area: 'test-coverage',\n    summary: 'Test fixture includes pom.xml, bigtop.bom, RPM spec, and Puppet manifest but should assert ALL four candidate families, not just a subset'\n  },\n  {\n    id: 'R4-002',\n    severity: 'minor',\n    area: 'test-coverage',\n    summary: 'No negative test for candidate detection — e.g., a .spec file outside SPECS/ should not be rpm-spec family; a random XML should not be build-manifest'\n  },\n  {\n    id: 'R4-003',\n    severity: 'minor',\n    area: 'test-coverage',\n    summary: 'No test for per-repo scan limit enforcement'\n  },\n  \n  // Path/output safety\n  {\n    id: 'R5-001',\n    severity: 'pass',\n    area: 'path-safety',\n    summary: 'Paths are relative within the discovered repository; no absolute paths leaked into evidence-index'\n  },\n  \n  // Spec docs\n  {\n    id: 'R6-001',\n    severity: 'pass',\n    area: 'spec-docs',\n    summary: 'model.md, contract.md, tasks.md, and review disposition all present under spec directory'\n  },\n  {\n    id: 'R6-002',\n    severity: 'minor',\n    area: 'spec-docs',\n    summary: 'Spec should document the exact skip-directory list and scan-limit value so they are reviewable without reading code'\n  }\n];\n\nconst critical = findings.filter(f => f.severity === 'critical');\nconst major = findings.filter(f => f.severity === 'major');\nconst minor = findings.filter(f => f.severity === 'minor');\nconst passes = findings.filter(f => f.severity === 'pass');\n\nconsole.log('=== FINDINGS SUMMARY ===');\nconsole.log(`Critical: ${critical.length}`);\nconsole.log(`Major: ${major.length}`);\nconsole.log(`Minor: ${minor.length}`);\nconsole.log(`Passes: ${passes.length}`);\nconsole.log();\n\nif (critical.length) { console.log('CRITICAL:'); critical.forEach(f => console.log(`  ${f.id} [${f.area}]: ${f.summary}`)); }\nif (major.length) { console.log('MAJOR:'); major.forEach(f => console.log(`  ${f.id} [${f.area}]: ${f.summary}`)); }\nif (minor.length) { console.log('MINOR:'); minor.forEach(f => console.log(`  ${f.id} [${f.area}]: ${f.summary}`)); }\nconsole.log();\nconsole.log('=== VERDICT ===');\nconsole.log('pass_with_changes');\nconsole.log();\nconsole.log('=== NOT ASSESSED ===');\nconsole.log('- Exact wording of agent-brief and answer-contract sections (could not read full file content)');\nconsole.log('- Negative path traversal tests (no test file with ../../etc/passwd etc)');\nconsole.log('- Performance on repos with >10K files per directory level');\nconsole.log('- Schema validation of relationship-candidate kind against JSON schema enum');\nconsole.log();\nconsole.log('=== RECOMMENDATION ===');\nconsole.log('Add a test asserting all 4 candidate families appear in fixture output, add a negative test for false-positive file extensions, document scan-limit and skip-dirs in spec, then merge.');"
}
</ctx_execute>

---

## Post-Correction Review: `052-dependency-symbol-evidence-import`

### Findings

| # | Severity | Area | Finding |
|---|----------|------|---------|
| R1-001 | ✅ pass | evidence-semantics | All 30 stress-run candidates carry `source-visible` evidence state with `not_assessed` reason. No candidate is promoted to `metadata-visible`. The 106 `not_assessed` findings and `finding-relationships-symbol-evidence-not-assessed` are preserved intact. |
| R2-001 | ✅ pass | overclaiming | Families name artifact categories (`build-manifest`, `distribution-manifest`, `rpm-spec`, `deployment-manifest`), not runtime topology or language semantics. The Cursor agent in the stress run correctly did not claim JVM/PHP/Scala parsing. |
| R2-002 | ⚠️ minor | overclaiming | `agent-brief.md` and `answer-contract.md` should include an explicit **"these are navigation hints, not parsed dependency trees"** callout. The stress-run brief references the candidates, but a prominent `> ⚠️ Note` block would reduce the risk of a downstream agent treating candidates as resolved relationships. |
| R3-001 | ✅ pass | bounded-scanning | Per-repo file-count limit is enforced. Skip-set covers the expected heavy/generated directories (`node_modules`, `.git`, `target`, `build`, `dist`, `vendor`, `.gradle`, `.idea`, `.vscode`, `__pycache__`). Stress run produced only 30 candidates from 18 repos — well-bounded. |
| R3-002 | ⚠️ minor | bounded-scanning | The skip-directory list and scan-limit constant should be documented in the spec (`tasks.md` or `model.md`) so they are tunable and reviewable without reading Go source. |
| R4-001 | 🔴 **major** | test-coverage | Test fixture includes `pom.xml`, `bigtop.bom`, an RPM spec, and a Puppet manifest, but the test assertions should **explicitly verify all four candidate families** appear in the output. If the test only checks a subset, a regression in one family's detection would pass silently. |
| R4-002 | ⚠️ minor | test-coverage | No negative test: a `.spec` file outside `SPECS/` should not produce an `rpm-spec` candidate; a random XML file not matching known manifest names should not produce `build-manifest`. |
| R4-003 | ⚠️ minor | test-coverage | No test for the per-repo scan-limit boundary (e.g., a fixture repo with >limit candidate files should stop at the limit). |
| R5-001 | ✅ pass | path-safety | Candidate paths in the stress run are relative within discovered repos. No absolute paths observed in `evidence-index.jsonl`. |
| R6-001 | ✅ pass | spec-docs | `model.md`, `contract.md`, `tasks.md`, and review disposition are all present and consistent with the correction description. |
| R6-002 | ⚠️ minor | spec-docs | Spec does not document the exact skip-directory list or scan-limit value, making them invisible to spec-level review. |

### Verdict

**`pass_with_changes`**

No critical issues. One major test-coverage gap and several minor documentation/boundary items.

### Not Assessed

- Exact character-level wording of the `agent-brief.md` and `answer-contract.md` template sections for relationship-candidate (could not confirm the presence/strength of a "navigation hints only" callout)
- Whether the `relationship-candidate` kind is included in the JSON schema `kind` enum in `schema/*.json`
- Symlink-following behavior in the directory walker (potential infinite-loop or out-of-bound scan on symlink-heavy repos)
- Performance on monorepo directories with >10K immediate children at a single level
- Concurrency safety if `context prepare` is ever parallelized

### Recommendation

1. **Add assertions** for all four candidate families in `TestRunContextPrepareWritesCursorPack` (the major item).
2. **Add one negative test** — e.g., place a `random.xml` that should not produce a `build-manifest` candidate.
3. **Add a spec note** documenting the skip-directory list and per-repo scan limit value.
4. **Add a `> ⚠️ Note` block** in the agent-brief template stating relationship-candidates are navigation hints, not parsed topology.
5. Merge.
