#!/bin/bash

# Archive Legacy Repositories Script
# Date: July 24, 2025
# Purpose: Safely archive all legacy repositories after successful migration

echo "🗄️  Archiving Legacy AI Business Factory Repositories"
echo "=================================================="

# Base directory for legacy projects
BASE_DIR="/Users/cnorton/Development"
ARCHIVE_DIR="/Users/cnorton/Development/archived-projects/ai-business-factory-legacy-$(date +%Y%m%d)"

# Create archive directory
mkdir -p "$ARCHIVE_DIR"

# List of repositories to archive
REPOS=(
    "ai-business-factory"
    "ai-business-factory-infrastructure"
    "ai-business-factory-business-generator"
    "ai-business-factory-data-collector"
    "ai-business-factory-market-validator"
    "ai-business-factory-opportunity-analyzer"
    "ai-business-factory-scheduler"
    "ai-business-factory-strategy-manager"
    "ai-business-factory-shared-utilities"
    "ai-business-factory-bmc-pwa"
    "ai-business-factory-idea-cards"
)

echo "📋 Repositories to archive: ${#REPOS[@]}"
echo ""

# Archive each repository
for repo in "${REPOS[@]}"; do
    if [ -d "$BASE_DIR/$repo" ]; then
        echo "📦 Archiving $repo..."
        
        # Create a git bundle for complete history preservation
        cd "$BASE_DIR/$repo"
        git bundle create "$ARCHIVE_DIR/$repo.bundle" --all
        
        # Create a tarball of the working directory
        cd "$BASE_DIR"
        tar -czf "$ARCHIVE_DIR/$repo.tar.gz" "$repo"
        
        echo "✅ Archived $repo"
    else
        echo "⚠️  $repo not found, skipping..."
    fi
done

echo ""
echo "📊 Creating archive summary..."

# Create archive summary
cat > "$ARCHIVE_DIR/ARCHIVE_SUMMARY.md" << EOF
# AI Business Factory Legacy Archive

**Archive Date**: $(date)
**Migration Completed**: July 24, 2025
**New Repository**: ai-business-factory-workspace

## Archived Repositories

$(for repo in "${REPOS[@]}"; do
    if [ -f "$ARCHIVE_DIR/$repo.bundle" ]; then
        echo "- ✅ $repo"
    fi
done)

## Archive Contents

- **.bundle files**: Complete git history with all branches and tags
- **.tar.gz files**: Working directory snapshots including uncommitted files

## Restoration Instructions

To restore a repository from bundle:
\`\`\`bash
git clone path/to/repo.bundle repo-name
\`\`\`

To extract working directory:
\`\`\`bash
tar -xzf repo-name.tar.gz
\`\`\`

## Migration Documentation

See the new monorepo for complete migration documentation:
- docs/MIGRATION-AFTER-ACTION-REPORT.md
- docs/ADR-011-Hybrid-Modular-Monorepo-Consolidation.md
- docs/MIGRATION-STATUS-GUIDE.md
EOF

echo "✅ Archive complete!"
echo ""
echo "📁 Archive location: $ARCHIVE_DIR"
echo "📏 Archive size: $(du -sh "$ARCHIVE_DIR" | cut -f1)"
echo ""
echo "🗑️  To remove original repositories after verifying archives:"
echo "   for repo in ${REPOS[@]}; do rm -rf \"$BASE_DIR/\$repo\"; done"
echo ""
echo "⚠️  Recommendation: Keep archives for at least 90 days before permanent deletion"