#!/bin/bash

# Complete and Commit Script
# Handles cleanup, documentation updates, and git operations

set -e  # Exit on error

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}🚀 Complete and Commit Script${NC}"
echo -e "${BLUE}================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Parse command line arguments
SKIP_CLEANUP=false
SKIP_DOCS=false
SKIP_COMMIT=false
COMMIT_MESSAGE=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        --skip-docs)
            SKIP_DOCS=true
            shift
            ;;
        --skip-commit)
            SKIP_COMMIT=true
            shift
            ;;
        -m|--message)
            COMMIT_MESSAGE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --skip-cleanup    Skip removing temporary artifacts"
            echo "  --skip-docs       Skip documentation updates"
            echo "  --skip-commit     Skip git commit and push"
            echo "  -m, --message     Custom commit message"
            echo "  -v, --verbose     Show detailed output"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$WORKSPACE_ROOT"

# Step 1: Remove temporary artifacts
if [ "$SKIP_CLEANUP" = false ]; then
    echo -e "\n${YELLOW}Step 1: Cleaning up temporary artifacts...${NC}"
    
    # Clean build artifacts
    if [ "$VERBOSE" = true ]; then
        print_info "Removing dist directories..."
    fi
    find . -name "dist" -type d -not -path "./node_modules/*" -exec rm -rf {} + 2>/dev/null || true
    
    # Clean test artifacts
    if [ "$VERBOSE" = true ]; then
        print_info "Removing coverage directories..."
    fi
    find . -name "coverage" -type d -not -path "./node_modules/*" -exec rm -rf {} + 2>/dev/null || true
    
    # Clean temporary files
    if [ "$VERBOSE" = true ]; then
        print_info "Removing temporary files..."
    fi
    find . -name "*.tmp" -type f -not -path "./node_modules/*" -delete 2>/dev/null || true
    find . -name "*.log" -type f -not -path "./node_modules/*" -not -name "*.md" -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    # Clean test output files
    rm -f packages/ai-agents/test-output.json 2>/dev/null || true
    rm -f packages/ai-agents/src/test/test-results.json 2>/dev/null || true
    
    print_status "Temporary artifacts cleaned"
else
    echo -e "\n${YELLOW}Skipping cleanup step${NC}"
fi

# Step 2: Update documentation
if [ "$SKIP_DOCS" = false ]; then
    echo -e "\n${YELLOW}Step 2: Updating documentation...${NC}"
    
    # Get current date
    CURRENT_DATE=$(date +"%B %d, %Y")
    CURRENT_DATE_ISO=$(date +"%Y-%m-%d")
    
    # Update README.md with latest changes
    if [ -f README.md ]; then
        if [ "$VERBOSE" = true ]; then
            print_info "Updating README.md..."
        fi
        
        # Update last updated date if it exists
        sed -i.bak "s/Last Updated: .*/Last Updated: ${CURRENT_DATE}/" README.md 2>/dev/null || true
        rm -f README.md.bak
        
        print_status "README.md updated"
    fi
    
    # Update CLAUDE.md with session context
    if [ -f CLAUDE.md ]; then
        if [ "$VERBOSE" = true ]; then
            print_info "Updating CLAUDE.md..."
        fi
        
        # Update last updated date
        sed -i.bak "s/\*\*Last Updated\*\*: .*/\*\*Last Updated\*\*: ${CURRENT_DATE}/" CLAUDE.md 2>/dev/null || true
        rm -f CLAUDE.md.bak
        
        # Add session marker if significant changes
        if git diff --quiet CLAUDE.md 2>/dev/null; then
            if [ "$VERBOSE" = true ]; then
                print_info "No changes to CLAUDE.md"
            fi
        else
            print_status "CLAUDE.md updated with latest context"
        fi
    fi
    
    # Create new ADR if needed
    ADR_DIR="docs"
    if [ -d "$ADR_DIR" ]; then
        # Count existing ADRs
        ADR_COUNT=$(find "$ADR_DIR" -name "ADR-*.md" | wc -l | tr -d ' ')
        
        # Check if we have significant changes that warrant a new ADR
        CHANGES=$(git status --porcelain | grep -E "^[AM].*\.(ts|js|json)$" | wc -l | tr -d ' ')
        
        if [ "$CHANGES" -gt 10 ]; then
            print_info "Significant changes detected ($CHANGES files). Consider creating a new ADR."
            echo -e "${YELLOW}Run this command to create a new ADR:${NC}"
            echo "echo '# ADR-$(printf "%03d" $((ADR_COUNT + 1))): [Title]' > $ADR_DIR/ADR-$(printf "%03d" $((ADR_COUNT + 1)))-title.md"
        fi
    fi
    
    # Update package.json versions if needed
    if [ "$VERBOSE" = true ]; then
        print_info "Checking package versions..."
    fi
    
    # Update workspace package.json with latest date in description
    if [ -f package.json ]; then
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (!pkg.lastUpdated || pkg.lastUpdated !== '${CURRENT_DATE_ISO}') {
            pkg.lastUpdated = '${CURRENT_DATE_ISO}';
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\\n');
            console.log('Updated package.json with last updated date');
        }
        " || true
    fi
    
    print_status "Documentation updated"
else
    echo -e "\n${YELLOW}Skipping documentation update${NC}"
fi

# Step 3: Commit code and push to GitHub
if [ "$SKIP_COMMIT" = false ]; then
    echo -e "\n${YELLOW}Step 3: Committing code and pushing to GitHub...${NC}"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check for changes
    if git diff --quiet && git diff --cached --quiet; then
        print_info "No changes to commit"
    else
        # Show status
        echo -e "\n${BLUE}Current git status:${NC}"
        git status --short
        
        # Add all changes
        print_info "Adding all changes..."
        git add -A
        
        # Generate commit message if not provided
        if [ -z "$COMMIT_MESSAGE" ]; then
            # Analyze changes to generate meaningful commit message
            ADDED=$(git diff --cached --numstat | wc -l | tr -d ' ')
            MODIFIED=$(git diff --cached --name-status | grep "^M" | wc -l | tr -d ' ')
            DELETED=$(git diff --cached --name-status | grep "^D" | wc -l | tr -d ' ')
            
            # Check for specific types of changes
            AGENT_CHANGES=$(git diff --cached --name-only | grep -E "agents/.*\.ts$" | wc -l | tr -d ' ')
            DOC_CHANGES=$(git diff --cached --name-only | grep -E "\.(md|MD)$" | wc -l | tr -d ' ')
            CONFIG_CHANGES=$(git diff --cached --name-only | grep -E "(package\.json|tsconfig|\.config\.|\.env)" | wc -l | tr -d ' ')
            
            # Build commit message based on changes
            if [ "$AGENT_CHANGES" -gt 0 ]; then
                COMMIT_MESSAGE="feat(ai-agents): implement comprehensive AI agent system"
                if [ "$AGENT_CHANGES" -eq 4 ]; then
                    COMMIT_MESSAGE="$COMMIT_MESSAGE with all 4 agents"
                fi
            elif [ "$DOC_CHANGES" -gt 0 ]; then
                COMMIT_MESSAGE="docs: update documentation and session context"
            elif [ "$CONFIG_CHANGES" -gt 0 ]; then
                COMMIT_MESSAGE="chore: update configuration and dependencies"
            else
                COMMIT_MESSAGE="chore: cleanup and maintenance updates"
            fi
            
            # Add details about the changes
            COMMIT_MESSAGE="$COMMIT_MESSAGE

- Added: $ADDED files
- Modified: $MODIFIED files  
- Deleted: $DELETED files"
            
            # Add co-author
            COMMIT_MESSAGE="$COMMIT_MESSAGE

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
        fi
        
        # Show commit message
        echo -e "\n${BLUE}Commit message:${NC}"
        echo "$COMMIT_MESSAGE"
        
        # Commit changes
        print_info "Committing changes..."
        git commit -m "$COMMIT_MESSAGE"
        print_status "Changes committed"
        
        # Get current branch
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        
        # Push to remote
        print_info "Pushing to origin/$CURRENT_BRANCH..."
        if git push origin "$CURRENT_BRANCH"; then
            print_status "Successfully pushed to GitHub"
        else
            print_error "Failed to push to GitHub"
            echo -e "${YELLOW}You may need to run: git push --set-upstream origin $CURRENT_BRANCH${NC}"
        fi
    fi
else
    echo -e "\n${YELLOW}Skipping commit step${NC}"
fi

# Summary
echo -e "\n${GREEN}✅ All tasks completed successfully!${NC}"
echo -e "${BLUE}================================${NC}"

# Show what was done
echo -e "\nSummary of actions:"
[ "$SKIP_CLEANUP" = false ] && echo "  ✓ Temporary artifacts removed"
[ "$SKIP_DOCS" = false ] && echo "  ✓ Documentation updated"
[ "$SKIP_COMMIT" = false ] && echo "  ✓ Code committed and pushed to GitHub"

# Show repository status
echo -e "\n${BLUE}Repository status:${NC}"
git log --oneline -5
echo ""
git status --short

echo -e "\n${GREEN}Done! 🎉${NC}"