package relationships

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDetectJVMReferences_BasicResolution(t *testing.T) {
	root := t.TempDir()

	// Module A defines org.example.shared.Util
	modADir := filepath.Join(root, "module-a")
	os.MkdirAll(modADir, 0755)
	os.WriteFile(filepath.Join(modADir, "Util.java"), []byte(`
package org.example.shared;
public class Util {
    public static String hello() { return "hi"; }
}
`), 0644)

	// Module B imports org.example.shared.Util
	modBDir := filepath.Join(root, "module-b")
	os.MkdirAll(modBDir, 0755)
	os.WriteFile(filepath.Join(modBDir, "App.java"), []byte(`
package org.example.app;
import org.example.shared.Util;
public class App {
    public static void main(String[] args) { Util.hello(); }
}
`), 0644)

	result := DetectJVMReferences(root)

	// Should have a references edge to jvm:org.example.shared.Util
	refEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "references" {
			refEdges++
		}
	}
	if refEdges < 1 {
		t.Errorf("expected >= 1 references edge, got %d", refEdges)
	}

	// The referenced node should be metadata-visible (resolved in-perimeter)
	for _, e := range result.Edges {
		if e.Kind == "references" && e.To == "jvm:org.example.shared.Util" {
			if e.Evidence.State != "metadata-visible" {
				t.Errorf("expected metadata-visible for in-perimeter ref, got %s", e.Evidence.State)
			}
		}
	}
}

func TestDetectJVMReferences_UnresolvedExternal(t *testing.T) {
	root := t.TempDir()

	os.WriteFile(filepath.Join(root, "App.java"), []byte(`
package org.example.app;
import com.google.gson.Gson;
import org.apache.commons.lang3.StringUtils;
public class App {}
`), 0644)

	result := DetectJVMReferences(root)

	// Both imports are unresolved → external references
	refEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "references" {
			refEdges++
		}
	}
	if refEdges != 2 {
		t.Errorf("expected 2 references edges (both external), got %d", refEdges)
	}
}

func TestDetectJVMReferences_StarImport(t *testing.T) {
	root := t.TempDir()

	// Define multiple classes in the same package
	os.WriteFile(filepath.Join(root, "A.java"), []byte(`
package org.example.pkg;
public class A {}
`), 0644)
	os.WriteFile(filepath.Join(root, "B.java"), []byte(`
package org.example.pkg;
public class B {}
`), 0644)
	// Star import from the same package
	os.WriteFile(filepath.Join(root, "C.java"), []byte(`
package org.example.other;
import org.example.pkg.*;
public class C {}
`), 0644)

	result := DetectJVMReferences(root)

	// Star import should be not_assessed (ambiguous)
	for _, e := range result.Edges {
		if e.Kind == "references" && e.To == "jvm:org.example.pkg.*" {
			if e.Evidence.State != "unknown" {
				t.Errorf("expected unknown evidence for star import, got %s", e.Evidence.State)
			}
		}
	}
}

func TestDetectJVMReferences_KotlinAndScala(t *testing.T) {
	root := t.TempDir()

	os.WriteFile(filepath.Join(root, "Data.kt"), []byte(`
package com.example.kotlin
class Data
`), 0644)
	os.WriteFile(filepath.Join(root, "App.kt"), []byte(`
package com.example.app
import com.example.kotlin.Data
class App
`), 0644)

	os.WriteFile(filepath.Join(root, "Model.scala"), []byte(`
package com.example.scala
class Model
`), 0644)
	os.WriteFile(filepath.Join(root, "Main.scala"), []byte(`
package com.example.scala.main
import com.example.scala.Model
object Main
`), 0644)

	result := DetectJVMReferences(root)

	refEdges := 0
	for _, e := range result.Edges {
		if e.Kind == "references" {
			refEdges++
		}
	}
	// Kotlin import + Scala import = 2 references
	if refEdges < 2 {
		t.Errorf("expected >= 2 references edges (Kotlin + Scala), got %d", refEdges)
	}
}

func TestDetectJVMReferences_NoJVMFiles(t *testing.T) {
	root := t.TempDir()
	os.WriteFile(filepath.Join(root, "app.py"), []byte("print('hello')"), 0644)

	result := DetectJVMReferences(root)
	if len(result.Edges) != 0 {
		t.Errorf("expected 0 edges for non-JVM directory, got %d", len(result.Edges))
	}
}

func TestDetectJVMReferences_StaticImport(t *testing.T) {
	root := t.TempDir()

	os.WriteFile(filepath.Join(root, "MathUtils.java"), []byte(`
package org.example.util;
public class MathUtils {
    public static int square(int x) { return x * x; }
}
`), 0644)
	os.WriteFile(filepath.Join(root, "App.java"), []byte(`
package org.example.app;
import static org.example.util.MathUtils.square;
public class App {
    public static void main(String[] args) { square(5); }
}
`), 0644)

	result := DetectJVMReferences(root)

	// Static import should resolve to the class
	found := false
	for _, e := range result.Edges {
		if e.Kind == "references" && stringsContains(e.To, "MathUtils") {
			found = true
		}
	}
	if !found {
		t.Error("expected a references edge resolving the static import")
	}
}

// stringsContains is a helper to avoid importing strings in test.
func stringsContains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsRune(s, substr))
}

func containsRune(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
