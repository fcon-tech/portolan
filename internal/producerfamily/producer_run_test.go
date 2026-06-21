package producerfamily

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestValidateProducerRunJSONLFileAcceptsVerifiedAndWeakRecords(t *testing.T) {
	root := t.TempDir()
	outputDir := filepath.Join(root, ".portolan", "stress", "tool-outputs")
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(outputDir, "compose.json"), []byte(`{"services":{"bigtop":{}}}`), 0o644); err != nil {
		t.Fatal(err)
	}
	recordsPath := filepath.Join(root, ".portolan", "producer-runs.jsonl")
	if err := os.MkdirAll(filepath.Dir(recordsPath), 0o755); err != nil {
		t.Fatal(err)
	}
	writeProducerRunFixture(t, recordsPath, strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-compose","producer_family":"deployment-model","producer_tool":"docker-compose","command":"DOCKER_IMAGE=example MEM_LIMIT=1g docker compose -f repos/apache-bigtop-repo/provisioner/docker/docker-compose.yml config --format json","target_root":"$ROOT","output_path":".portolan/stress/tool-outputs/compose.json","output_format":"json","scope":{"repository":"apache-bigtop-repo","directory":"provisioner/docker","covered_units":["service:bigtop"]},"freshness":"2026-06-01T20:25:23Z","status":"verified","evidence_state":"metadata-visible","limitations":["static deployment model only","not runtime topology"],"privacy_review":"not_assessed"}
{"record_type":"producer-run","id":"producer-run-runtime-not-assessed","producer_family":"runtime-observation","producer_tool":"runtime-observation-export","command":"operator did not provide a runtime observation export","target_root":"$ROOT","scope":{"repository":"apache-bigtop-repo"},"status":"not_assessed","evidence_state":"not_assessed","limitations":["no runtime-visible local observation supplied"],"privacy_review":"not_assessed"}`, "$ROOT", root))

	records, err := ValidateProducerRunJSONLFile(recordsPath)
	if err != nil {
		t.Fatalf("ValidateProducerRunJSONLFile returned error: %v", err)
	}
	if len(records) != 2 {
		t.Fatalf("records = %d, want 2", len(records))
	}
}

func TestValidateProducerRunTemplateFixture(t *testing.T) {
	root := t.TempDir()
	outputDir := filepath.Join(root, ".portolan", "stress", "tool-outputs")
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		t.Fatal(err)
	}
	for name, content := range map[string]string{
		"compose.json": `{"services":{"bigtop":{}}}`,
		"grpc.pb":      "descriptor",
	} {
		if err := os.WriteFile(filepath.Join(outputDir, name), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	template, err := os.ReadFile("../../internal/testfixtures/real-producer-output-proof/producer-runs.template.jsonl")
	if err != nil {
		t.Fatal(err)
	}
	recordsPath := filepath.Join(root, ".portolan", "producer-runs.jsonl")
	if err := os.WriteFile(recordsPath, []byte(strings.ReplaceAll(string(template), "__PORTOLAN_TEST_ROOT__", root)), 0o644); err != nil {
		t.Fatal(err)
	}

	records, err := ValidateProducerRunJSONLFile(recordsPath)
	if err != nil {
		t.Fatalf("ValidateProducerRunJSONLFile returned error: %v", err)
	}
	if len(records) != 3 {
		t.Fatalf("records = %d, want 3", len(records))
	}
}

func TestValidateProducerRunAcceptsLocalSafePrivacyReview(t *testing.T) {
	root := t.TempDir()
	output := filepath.Join(root, ".portolan", "descriptor.pb")
	if err := os.MkdirAll(filepath.Dir(output), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(output, []byte("descriptor"), 0o644); err != nil {
		t.Fatal(err)
	}
	record := strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-local-safe","producer_family":"api-catalog","producer_tool":"protoc","command":"protoc --descriptor_set_out=.portolan/descriptor.pb service.proto","target_root":"$ROOT","output_path":".portolan/descriptor.pb","output_format":"protobuf-descriptor","scope":{"repository":"alluxio"},"status":"verified","evidence_state":"metadata-visible","privacy_review":"local_safe"}`, "$ROOT", root)

	if _, err := ValidateProducerRunJSON([]byte(record)); err != nil {
		t.Fatalf("ValidateProducerRunJSON returned error: %v", err)
	}
}

func TestValidateProducerRunRejectsRuntimeVisibleStaticProducer(t *testing.T) {
	root := t.TempDir()
	output := filepath.Join(root, ".portolan", "compose.json")
	if err := os.MkdirAll(filepath.Dir(output), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(output, []byte(`{}`), 0o644); err != nil {
		t.Fatal(err)
	}
	record := strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-compose","producer_family":"deployment-model","producer_tool":"docker-compose","command":"docker compose -f compose.yml config --format json","target_root":"$ROOT","output_path":".portolan/compose.json","output_format":"json","scope":{"repository":"apache-bigtop-repo"},"status":"verified","evidence_state":"runtime-visible","privacy_review":"not_assessed"}`, "$ROOT", root)

	_, err := ValidateProducerRunJSON([]byte(record))
	if err == nil {
		t.Fatal("ValidateProducerRunJSON returned nil, want runtime-visible error")
	}
	if !strings.Contains(err.Error(), "runtime-visible") {
		t.Fatalf("error = %q, want runtime-visible context", err)
	}
}

func TestValidateProducerRunRejectsOutputPathTraversal(t *testing.T) {
	root := t.TempDir()
	outside := filepath.Join(t.TempDir(), "descriptor.pb")
	if err := os.WriteFile(outside, []byte("descriptor"), 0o644); err != nil {
		t.Fatal(err)
	}
	record := strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-traversal","producer_family":"api-catalog","producer_tool":"protoc","command":"protoc --descriptor_set_out=../outside/descriptor.pb service.proto","target_root":"$ROOT","output_path":"../outside/descriptor.pb","output_format":"protobuf-descriptor","scope":{"repository":"alluxio"},"status":"verified","evidence_state":"metadata-visible","privacy_review":"not_assessed"}`, "$ROOT", root)

	_, err := ValidateProducerRunJSON([]byte(record))
	if err == nil {
		t.Fatal("ValidateProducerRunJSON returned nil, want traversal error")
	}
	if !strings.Contains(err.Error(), "within target_root") {
		t.Fatalf("error = %q, want target_root containment context", err)
	}
}

func TestValidateProducerRunRejectsVerifiedRecordWithoutOutputPath(t *testing.T) {
	root := t.TempDir()
	record := strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-missing-output","producer_family":"api-catalog","producer_tool":"protoc","command":"protoc --descriptor_set_out=.portolan/out.pb service.proto","target_root":"$ROOT","output_format":"protobuf-descriptor","scope":{"repository":"alluxio"},"status":"verified","evidence_state":"metadata-visible","privacy_review":"not_assessed"}`, "$ROOT", root)

	_, err := ValidateProducerRunJSON([]byte(record))
	if err == nil {
		t.Fatal("ValidateProducerRunJSON returned nil, want output_path error")
	}
	if !strings.Contains(err.Error(), "output_path") {
		t.Fatalf("error = %q, want output_path context", err)
	}
}

func TestValidateProducerRunRejectsVerifiedRecordWithEmptyScope(t *testing.T) {
	root := t.TempDir()
	output := filepath.Join(root, ".portolan", "descriptor.pb")
	if err := os.MkdirAll(filepath.Dir(output), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(output, []byte("descriptor"), 0o644); err != nil {
		t.Fatal(err)
	}
	record := strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-empty-scope","producer_family":"api-catalog","producer_tool":"protoc","command":"protoc --descriptor_set_out=.portolan/descriptor.pb service.proto","target_root":"$ROOT","output_path":".portolan/descriptor.pb","output_format":"protobuf-descriptor","scope":{},"status":"verified","evidence_state":"metadata-visible","privacy_review":"not_assessed"}`, "$ROOT", root)

	_, err := ValidateProducerRunJSON([]byte(record))
	if err == nil {
		t.Fatal("ValidateProducerRunJSON returned nil, want scope error")
	}
	if !strings.Contains(err.Error(), "scope") {
		t.Fatalf("error = %q, want scope context", err)
	}
}

func TestValidateProducerRunRejectsUnsafeCommand(t *testing.T) {
	root := t.TempDir()
	record := strings.ReplaceAll(`{"record_type":"producer-run","id":"producer-run-unsafe","producer_family":"api-catalog","producer_tool":"remote","command":"curl https://example.com/spec.json --token secret","target_root":"$ROOT","scope":{"repository":"api"},"status":"blocked","evidence_state":"not_assessed","limitations":["requires network"],"privacy_review":"blocked"}`, "$ROOT", root)

	_, err := ValidateProducerRunJSON([]byte(record))
	if err == nil {
		t.Fatal("ValidateProducerRunJSON returned nil, want unsafe command error")
	}
	if !strings.Contains(err.Error(), "network") {
		t.Fatalf("error = %q, want network context", err)
	}
}

func writeProducerRunFixture(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content+"\n"), 0o644); err != nil {
		t.Fatalf("write fixture: %v", err)
	}
}
