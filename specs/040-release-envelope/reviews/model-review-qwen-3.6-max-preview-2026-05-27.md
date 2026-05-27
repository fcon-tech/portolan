# Raw Model Review: openrouter/qwen/qwen3.6-max-preview

Date: 2026-05-27

Command shape:

```bash
pi --no-tools --no-context-files --no-session --model openrouter/qwen/qwen3.6-max-preview -p <bounded spec-040 review packet>
```

Result: failed, not counted as assessed evidence

Raw output:

```text
400 Provider returned error
{"error":{"message":"developer is not one of ['system', 'assistant', 'user', 'tool', 'function'] - 'messages.['0].role'","type":"invalid_request_error","param":null,"code":null},"request_id":"chatcmpl-c8d6920e-877f-9f46-9825-4be540368ff1"}
```
