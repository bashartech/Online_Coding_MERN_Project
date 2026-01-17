#!/bin/bash

# Setup script for plan creation
# Outputs JSON with required variables

SPEC_FILE="specs/1-code-editor-session/spec.md"
PLAN_FILE="specs/1-code-editor-session/plan.md"
SPECS_DIR="specs/1-code-editor-session"
BRANCH="1-code-editor-session"

# Output as JSON
cat <<EOF
{
  "FEATURE_SPEC": "$SPEC_FILE",
  "IMPL_PLAN": "$PLAN_FILE",
  "SPECS_DIR": "$SPECS_DIR",
  "BRANCH": "$BRANCH"
}
EOF
