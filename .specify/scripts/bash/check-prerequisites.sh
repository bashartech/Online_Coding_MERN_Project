#!/bin/bash

# Prerequisite check script
# Outputs JSON with feature directory and available docs

FEATURE_DIR="specs/1-code-editor-session"

# List available documentation files
echo '{'
echo '  "FEATURE_DIR": "specs/1-code-editor-session",'
echo '  "AVAILABLE_DOCS": ['
echo '    "specs/1-code-editor-session/spec.md",'
echo '    "specs/1-code-editor-session/plan.md",'
echo '    "specs/1-code-editor-session/data-model.md",'
echo '    "specs/1-code-editor-session/research.md",'
echo '    "specs/1-code-editor-session/quickstart.md",'
echo '    "specs/1-code-editor-session/contracts/sessions-api.yaml"'
echo '  ]'
echo '}'
