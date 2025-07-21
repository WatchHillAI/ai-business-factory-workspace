#!/bin/bash

# Smart Clean and Commit Script
# Intelligently analyzes changes and creates meaningful commits without requiring Claude CLI

set -e  # Exit on error

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${PURPLE}🧠 Smart Clean and Commit Script${NC}"
echo -e "${PURPLE}==================================${NC}"

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

print_smart() {
    echo -e "${PURPLE}🧠${NC} $1"
}

# Parse command line arguments
SKIP_CLEANUP=false
SKIP_DOCS=false
SKIP_COMMIT=false
CUSTOM_MESSAGE=""
VERBOSE=false
AUTO_MODE=true

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
            CUSTOM_MESSAGE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --manual)
            AUTO_MODE=false
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
            echo "  --manual          Disable automatic analysis"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                          # Full auto mode"
            echo "  $0 -m \"feat: add feature\"   # Custom message"
            echo "  $0 --skip-cleanup           # Skip cleanup step"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$WORKSPACE_ROOT"

# Function to analyze changes intelligently
analyze_changes() {
    local analysis=""
    
    # Get statistics
    local added=$(git diff --cached --numstat | awk '{s+=$1} END {print s}' || echo 0)
    local deleted=$(git diff --cached --numstat | awk '{s+=$2} END {print s}' || echo 0)
    local files_changed=$(git diff --cached --name-only | wc -l | tr -d ' ')
    
    # Analyze file types
    local ts_files=$(git diff --cached --name-only | grep -E "\.ts$" | wc -l | tr -d ' ')
    local js_files=$(git diff --cached --name-only | grep -E "\.js$" | wc -l | tr -d ' ')
    local md_files=$(git diff --cached --name-only | grep -E "\.md$" | wc -l | tr -d ' ')
    local json_files=$(git diff --cached --name-only | grep -E "\.json$" | wc -l | tr -d ' ')
    
    # Analyze specific changes
    local agent_changes=$(git diff --cached --name-only | grep -E "agents/.*\.ts$" | wc -l | tr -d ' ')
    local test_changes=$(git diff --cached --name-only | grep -E "(test|spec)\." | wc -l | tr -d ' ')
    local config_changes=$(git diff --cached --name-only | grep -E "(config|package\.json|tsconfig)" | wc -l | tr -d ' ')
    
    # Build analysis
    analysis="Changes: $files_changed files (+$added -$deleted lines)"
    
    if [ "$agent_changes" -gt 0 ]; then
        analysis="$analysis | AI Agents: $agent_changes"
    fi
    if [ "$test_changes" -gt 0 ]; then
        analysis="$analysis | Tests: $test_changes"
    fi
    if [ "$md_files" -gt 0 ]; then
        analysis="$analysis | Docs: $md_files"
    fi
    
    echo "$analysis"
}

# Function to generate smart commit message
generate_commit_message() {
    local message=""
    local body=""
    
    # Analyze what changed
    local agent_files=$(git diff --cached --name-only | grep -E "agents/.*\.ts$")
    local provider_files=$(git diff --cached --name-only | grep -E "providers/.*\.ts$")
    local test_files=$(git diff --cached --name-only | grep -E "(test|spec)\.")
    local doc_files=$(git diff --cached --name-only | grep -E "\.md$")
    local config_files=$(git diff --cached --name-only | grep -E "(package\.json|tsconfig|\.config)")
    
    # Count changes by category
    local agent_count=$(echo "$agent_files" | grep -v "^$" | wc -l | tr -d ' ')
    local provider_count=$(echo "$provider_files" | grep -v "^$" | wc -l | tr -d ' ')
    local test_count=$(echo "$test_files" | grep -v "^$" | wc -l | tr -d ' ')
    local doc_count=$(echo "$doc_files" | grep -v "^$" | wc -l | tr -d ' ')
    
    # Determine primary change type
    if [ "$agent_count" -gt 0 ]; then
        # Check which agents were modified
        if echo "$agent_files" | grep -q "FinancialModelingAgent"; then
            body="- Implement Financial Modeling Agent with TAM/SAM/SOM analysis"
        fi
        if echo "$agent_files" | grep -q "FounderFitAgent"; then
            body="$body\n- Implement Founder Fit Agent with skills and team analysis"
        fi
        if echo "$agent_files" | grep -q "RiskAssessmentAgent"; then
            body="$body\n- Implement Risk Assessment Agent with mitigation strategies"
        fi
        if echo "$agent_files" | grep -q "MarketResearchAgent"; then
            body="$body\n- Update Market Research Agent implementation"
        fi
        
        if [ "$agent_count" -ge 3 ]; then
            message="feat(ai-agents): implement comprehensive AI agent system"
        else
            message="feat(ai-agents): implement new AI agents"
        fi
        
    elif [ "$test_count" -gt 0 ]; then
        message="test: add comprehensive test suite"
        body="- Add test suite for AI agents\n- Implement validation tests"
        
    elif [ "$doc_count" -gt 0 ]; then
        message="docs: update documentation"
        if echo "$doc_files" | grep -q "README"; then
            body="- Update README with latest features"
        fi
        if echo "$doc_files" | grep -q "CLAUDE"; then
            body="$body\n- Update CLAUDE.md with session context"
        fi
        if echo "$doc_files" | grep -q "ADR"; then
            body="$body\n- Add architecture decision record"
        fi
        
    elif [ "$config_files" != "" ]; then
        message="chore: update configuration"
        body="- Update project configuration\n- Modify build settings"
        
    else
        # Generic message based on stats
        local added=$(git diff --cached --numstat | awk '{s+=$1} END {print s}')
        local deleted=$(git diff --cached --numstat | awk '{s+=$2} END {print s}')
        
        if [ "$added" -gt "$deleted" ]; then
            message="feat: add new functionality"
        elif [ "$deleted" -gt "$added" ]; then
            message="refactor: cleanup and optimize code"
        else
            message="chore: update codebase"
        fi
        
        body="- Modified $(git diff --cached --name-only | wc -l | tr -d ' ') files\n- Added $added lines, removed $deleted lines"
    fi
    
    # Add file statistics
    if [ -n "$body" ]; then
        local files_changed=$(git diff --cached --name-only | wc -l | tr -d ' ')
        body="$body\n\nAffects $files_changed files"
    fi
    
    # Combine message and body
    if [ -n "$body" ]; then
        echo -e "$message\n\n$body"
    else
        echo "$message"
    fi
}

# Step 1: Analyze repository changes
if [ "$AUTO_MODE" = true ]; then
    echo -e "\n${YELLOW}Step 1: Analyzing Changes...${NC}"
    
    if ! git diff --quiet || ! git diff --cached --quiet; then
        ANALYSIS=$(analyze_changes)
        print_smart "$ANALYSIS"
    else
        print_info "No changes detected"
    fi
fi

# Step 2: Clean temporary artifacts
if [ "$SKIP_CLEANUP" = false ]; then
    echo -e "\n${YELLOW}Step 2: Cleaning Temporary Artifacts...${NC}"
    
    # Count files before cleaning
    TEMP_COUNT=$(find . -name "*.tmp" -o -name "*.log" -o -name ".DS_Store" -o -name "*.bak" | grep -v node_modules | wc -l | tr -d ' ')
    
    if [ "$TEMP_COUNT" -gt 0 ]; then
        print_info "Found $TEMP_COUNT temporary files"
    fi
    
    # Clean build artifacts
    find . -name "dist" -type d -not -path "./node_modules/*" -exec rm -rf {} + 2>/dev/null || true
    find . -name "coverage" -type d -not -path "./node_modules/*" -exec rm -rf {} + 2>/dev/null || true
    
    # Clean temporary files
    find . -name "*.tmp" -type f -not -path "./node_modules/*" -delete 2>/dev/null || true
    find . -name "*.log" -type f -not -path "./node_modules/*" -not -name "*.md" -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    find . -name "*.bak" -type f -not -path "./node_modules/*" -delete 2>/dev/null || true
    
    # Clean test artifacts
    rm -f packages/*/test-output.json 2>/dev/null || true
    rm -f packages/*/src/test/test-results.json 2>/dev/null || true
    
    print_status "Cleaned $TEMP_COUNT temporary files"
fi

# Step 3: Update documentation timestamps
if [ "$SKIP_DOCS" = false ]; then
    echo -e "\n${YELLOW}Step 3: Updating Documentation...${NC}"
    
    CURRENT_DATE=$(date +"%B %d, %Y")
    CURRENT_DATE_SHORT=$(date +"%B %d, %Y")
    
    # Update CLAUDE.md
    if [ -f CLAUDE.md ]; then
        # Update last updated date
        sed -i.bak "s/\*\*Last Updated\*\*: .*/\*\*Last Updated\*\*: ${CURRENT_DATE}/" CLAUDE.md 2>/dev/null || true
        rm -f CLAUDE.md.bak
        print_status "Updated CLAUDE.md timestamp"
    fi
    
    # Update README.md if it has a last updated field
    if [ -f README.md ] && grep -q "Last Updated:" README.md; then
        sed -i.bak "s/Last Updated: .*/Last Updated: ${CURRENT_DATE}/" README.md 2>/dev/null || true
        rm -f README.md.bak
        print_status "Updated README.md timestamp"
    fi
    
    # Check if ADR might be needed
    SIGNIFICANT_FILES=$(git diff --cached --name-only | grep -E "\.(ts|js)$" | wc -l | tr -d ' ')
    if [ "$SIGNIFICANT_FILES" -gt 10 ]; then
        print_info "Consider creating an ADR - $SIGNIFICANT_FILES significant files changed"
        
        # Show what major components were affected
        echo "  Major components affected:"
        git diff --cached --name-only | grep -E "\.(ts|js)$" | cut -d'/' -f1-3 | sort | uniq | head -5 | while read -r component; do
            echo "    - $component"
        done
    fi
fi

# Step 4: Commit and push
if [ "$SKIP_COMMIT" = false ]; then
    echo -e "\n${YELLOW}Step 4: Committing and Pushing...${NC}"
    
    # Check for changes
    if git diff --quiet && git diff --cached --quiet; then
        print_info "No changes to commit"
    else
        # Stage all changes
        print_info "Staging all changes..."
        git add -A
        
        # Generate or use custom commit message
        if [ -z "$CUSTOM_MESSAGE" ]; then
            if [ "$AUTO_MODE" = true ]; then
                print_smart "Generating smart commit message..."
                COMMIT_MESSAGE=$(generate_commit_message)
                
                # Add co-author credit
                COMMIT_MESSAGE="$COMMIT_MESSAGE

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
            else
                # Manual mode - ask for message
                echo "Enter commit message (or press Enter for default):"
                read -r USER_MESSAGE
                if [ -n "$USER_MESSAGE" ]; then
                    COMMIT_MESSAGE="$USER_MESSAGE"
                else
                    COMMIT_MESSAGE="chore: update codebase"
                fi
            fi
        else
            COMMIT_MESSAGE="$CUSTOM_MESSAGE"
        fi
        
        # Show commit message
        echo -e "\n${BLUE}Commit message:${NC}"
        echo "$COMMIT_MESSAGE"
        echo ""
        
        # Show what will be committed
        echo -e "${BLUE}Files to commit:${NC}"
        git diff --cached --name-status | head -10
        TOTAL_FILES=$(git diff --cached --name-only | wc -l | tr -d ' ')
        if [ "$TOTAL_FILES" -gt 10 ]; then
            echo "... and $((TOTAL_FILES - 10)) more files"
        fi
        
        # Confirm if in manual mode
        if [ "$AUTO_MODE" = false ]; then
            echo -e "\n${YELLOW}Proceed with commit? (y/N)${NC}"
            read -r CONFIRM
            if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
                print_info "Commit cancelled"
                exit 0
            fi
        fi
        
        # Commit
        git commit -m "$COMMIT_MESSAGE"
        print_status "Changes committed"
        
        # Get current branch
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        
        # Push to remote
        print_info "Pushing to origin/$CURRENT_BRANCH..."
        
        if git push origin "$CURRENT_BRANCH" 2>/dev/null; then
            print_status "Successfully pushed to GitHub"
        else
            print_error "Push failed"
            echo -e "${YELLOW}Try: git push --set-upstream origin $CURRENT_BRANCH${NC}"
        fi
    fi
fi

# Summary
echo -e "\n${GREEN}✅ All Done!${NC}"
echo -e "${PURPLE}==================================${NC}"

# Show summary
echo -e "\nCompleted actions:"
[ "$SKIP_CLEANUP" = false ] && echo "  ✓ Cleaned temporary artifacts"
[ "$SKIP_DOCS" = false ] && echo "  ✓ Updated documentation timestamps"
[ "$SKIP_COMMIT" = false ] && echo "  ✓ Committed and pushed changes"

# Show current status
echo -e "\n${BLUE}Current status:${NC}"
git log --oneline -1
echo ""
CHANGES_REMAINING=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$CHANGES_REMAINING" -eq 0 ]; then
    echo "Working directory clean ✨"
else
    echo "$CHANGES_REMAINING uncommitted changes remaining"
fi

echo -e "\n${PURPLE}Happy coding! 🚀${NC}"