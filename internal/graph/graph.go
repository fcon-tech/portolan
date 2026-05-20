package graph

const SchemaVersion = "0.1.0"

type EvidenceState string

const (
	SourceVisible   EvidenceState = "source-visible"
	MetadataVisible EvidenceState = "metadata-visible"
	RuntimeVisible  EvidenceState = "runtime-visible"
	ClaimOnly       EvidenceState = "claim-only"
	Unknown         EvidenceState = "unknown"
	CannotVerify    EvidenceState = "cannot_verify"
)

type Evidence struct {
	State  EvidenceState `json:"state"`
	Source string        `json:"source"`
	Reason string        `json:"reason,omitempty"`
}

type Node struct {
	ID       string   `json:"id"`
	Kind     string   `json:"kind"`
	Label    string   `json:"label"`
	Evidence Evidence `json:"evidence"`
}

type Edge struct {
	From     string   `json:"from"`
	To       string   `json:"to"`
	Kind     string   `json:"kind"`
	Evidence Evidence `json:"evidence"`
}

type Graph struct {
	SchemaVersion string `json:"schema_version"`
	GeneratedBy   string `json:"generated_by"`
	Nodes         []Node `json:"nodes"`
	Edges         []Edge `json:"edges"`
}

func New() Graph {
	return Graph{
		SchemaVersion: SchemaVersion,
		GeneratedBy:   "portolan",
		Nodes:         []Node{},
		Edges:         []Edge{},
	}
}
