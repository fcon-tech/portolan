<context_window_protection>
  <action_type>research</action_type>
  <description>Explore the spec directory structure</description>
  <tool_calls>
    <tool_call name="ctx_batch_execute">
      <commands>
        <command>
          <label>spec-directory-listing</label>
          <command>find specs/042-agent-adapter-layer -type f 2>/dev/null | sort; echo "---EXISTS---"; test -d specs/042-agent-adapter-layer && echo "yes" || echo "no"</command>
        </command>
      </commands>
    </tool_call>
  </tool_calls>
</context_window_protection>
