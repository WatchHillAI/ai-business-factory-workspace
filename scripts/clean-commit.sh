#!/bin/bash

# AI-Powered Clean and Commit Script
# Uses Claude to intelligently analyze changes, update docs, and create meaningful commits

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

echo -e "${PURPLE}🤖 AI-Powered Clean and Commit Script${NC}"
echo -e "${PURPLE}======================================${NC}"

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

print_ai() {
    echo -e "${PURPLE}🤖${NC} $1"
}

# Check if claude is available
if ! command -v claude &> /dev/null; then
    print_error "Claude CLI not found. Please install claude-cli to use AI features."
    echo "Visit: https://github.com/anthropics/claude-cli"
    exit 1
fi

# Parse command line arguments
SKIP_CLEANUP=false
SKIP_DOCS=false
SKIP_COMMIT=false
CUSTOM_MESSAGE=""
AI_ANALYSIS=true
VERBOSE=false
DRY_RUN=false

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
        --no-ai)
            AI_ANALYSIS=false
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
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --skip-cleanup    Skip removing temporary artifacts"
            echo "  --skip-docs       Skip documentation updates"
            echo "  --skip-commit     Skip git commit and push"
            echo "  --no-ai           Don't use AI for analysis"
            echo "  -m, --message     Custom commit message (overrides AI)"
            echo "  -v, --verbose     Show detailed output"
            echo "  --dry-run         Show what would be done without doing it"
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

# Function to get AI analysis
get_ai_analysis() {
    local prompt="$1"
    local max_tokens="${2:-2000}"
    
    if [ "$AI_ANALYSIS" = false ]; then
        echo ""
        return
    fi
    
    # Use claude to analyze
    local response=$(claude -q "$prompt" 2>/dev/null || echo "")
    echo "$response"
}

# Step 1: AI-powered change analysis
if [ "$AI_ANALYSIS" = true ]; then
    echo -e "\n${YELLOW}Step 1: AI Analysis of Changes...${NC}"
    print_ai "Analyzing repository changes..."
    
    # Get git diff for analysis
    GIT_STATUS=$(git status --porcelain)
    GIT_DIFF=$(git diff --staged --stat)
    GIT_DIFF_DETAILED=$(git diff --staged --name-status | head -20)
    
    # Get list of changed files
    CHANGED_FILES=$(git diff --staged --name-only | head -30)
    
    ANALYSIS_PROMPT="Analyze these git changes and provide a brief summary (2-3 sentences) of what was accomplished:

Git Status:
$GIT_STATUS

Changed Files:
$CHANGED_FILES

Diff Summary:
$GIT_DIFF

Focus on high-level accomplishments, not file-by-file changes. What features were added? What problems were solved?"

    CHANGE_SUMMARY=$(get_ai_analysis "$ANALYSIS_PROMPT" 500)
    
    if [ -n "$CHANGE_SUMMARY" ]; then
        echo -e "\n${PURPLE}AI Summary:${NC}"
        echo "$CHANGE_SUMMARY"
    fi
fi

# Step 2: Clean temporary artifacts
if [ "$SKIP_CLEANUP" = false ]; then
    echo -e "\n${YELLOW}Step 2: Cleaning temporary artifacts...${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        print_info "DRY RUN: Would remove temporary files"
    else
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
        
        print_status "Temporary artifacts cleaned"
    fi
fi

# Step 3: AI-powered documentation updates
if [ "$SKIP_DOCS" = false ] && [ "$AI_ANALYSIS" = true ]; then
    echo -e "\n${YELLOW}Step 3: AI-Powered Documentation Updates...${NC}"
    
    CURRENT_DATE=$(date +"%B %d, %Y")
    CURRENT_DATE_ISO=$(date +"%Y-%m-%d")
    
    # Update CLAUDE.md with AI analysis
    if [ -f CLAUDE.md ] && [ -n "$CHANGE_SUMMARY" ]; then
        print_ai "Updating CLAUDE.md with session context..."
        
        CLAUDE_UPDATE_PROMPT="Based on these changes, write a 2-3 line update for CLAUDE.md's development context section. Include what was accomplished and current status:

Changes Summary: $CHANGE_SUMMARY

Format as markdown, focusing on technical accomplishments and system capabilities added."

        CLAUDE_UPDATE=$(get_ai_analysis "$CLAUDE_UPDATE_PROMPT" 300)
        
        if [ -n "$CLAUDE_UPDATE" ] && [ "$DRY_RUN" = false ]; then
            # Update last updated date
            sed -i.bak "s/\*\*Last Updated\*\*: .*/\*\*Last Updated\*\*: ${CURRENT_DATE}/" CLAUDE.md 2>/dev/null || true
            rm -f CLAUDE.md.bak
            
            # Add session update at the end of development context if it exists
            if grep -q "Development Context for Future Sessions" CLAUDE.md; then
                # Create a temporary file with the update
                echo -e "\n### 🔄 Latest Update (${CURRENT_DATE}):\n${CLAUDE_UPDATE}" > /tmp/claude_update.tmp
                
                # Find line number of development context section
                LINE_NUM=$(grep -n "Development Context for Future Sessions" CLAUDE.md | cut -d: -f1)
                
                if [ -n "$LINE_NUM" ]; then
                    # Insert after the context header
                    sed -i.bak "${LINE_NUM}a\\
\\
### 🔄 Latest Update (${CURRENT_DATE}):\\
${CLAUDE_UPDATE}" CLAUDE.md 2>/dev/null || true
                    rm -f CLAUDE.md.bak
                fi
                
                rm -f /tmp/claude_update.tmp
            fi
            
            print_status "CLAUDE.md updated with AI-generated context"
        fi
    fi
    
    # Check if we need a new ADR
    SIGNIFICANT_CHANGES=$(git diff --staged --name-only | grep -E "\.(ts|js|json)$" | wc -l | tr -d ' ')
    
    if [ "$SIGNIFICANT_CHANGES" -gt 10 ]; then
        print_ai "Analyzing if ADR is needed..."
        
        ADR_PROMPT="Based on these changes, determine if an Architecture Decision Record (ADR) is warranted. Changed files: $CHANGED_FILES

Respond with YES or NO followed by a brief reason."

        ADR_NEEDED=$(get_ai_analysis "$ADR_PROMPT" 100)
        
        if [[ "$ADR_NEEDED" == YES* ]]; then
            print_info "AI recommends creating an ADR: $ADR_NEEDED"
            
            if [ "$DRY_RUN" = false ]; then
                # Generate ADR title
                ADR_TITLE_PROMPT="Generate a concise ADR title (5-7 words) for these changes: $CHANGE_SUMMARY"
                ADR_TITLE=$(get_ai_analysis "$ADR_TITLE_PROMPT" 50)
                
                if [ -n "$ADR_TITLE" ]; then
                    ADR_COUNT=$(find docs -name "ADR-*.md" 2>/dev/null | wc -l | tr -d ' ')
                    ADR_NUM=$(printf "%03d" $((ADR_COUNT + 1)))
                    ADR_FILE="docs/ADR-${ADR_NUM}-${ADR_TITLE// /-}.md"
                    
                    echo "# ADR-${ADR_NUM}: ${ADR_TITLE}" > "$ADR_FILE"
                    echo "" >> "$ADR_FILE"
                    echo "**Date**: ${CURRENT_DATE_ISO}" >> "$ADR_FILE"
                    echo "**Status**: Proposed" >> "$ADR_FILE"
                    echo "" >> "$ADR_FILE"
                    echo "## Context" >> "$ADR_FILE"
                    echo "$CHANGE_SUMMARY" >> "$ADR_FILE"
                    echo "" >> "$ADR_FILE"
                    echo "## Decision" >> "$ADR_FILE"
                    echo "[To be completed]" >> "$ADR_FILE"
                    
                    print_status "Created ADR: $ADR_FILE"
                fi
            fi
        fi
    fi
    
    # Update README if significant features added
    if [ -f README.md ] && [[ "$CHANGE_SUMMARY" == *"feature"* || "$CHANGE_SUMMARY" == *"implement"* ]]; then
        print_ai "Checking if README needs updates..."
        
        README_PROMPT="Does this change warrant a README update? $CHANGE_SUMMARY

Respond with YES or NO."

        README_UPDATE_NEEDED=$(get_ai_analysis "$README_PROMPT" 20)
        
        if [[ "$README_UPDATE_NEEDED" == YES* ]]; then
            print_info "Consider updating README.md with new features"
        fi
    fi
fi

# Step 4: AI-powered commit message generation and push
if [ "$SKIP_COMMIT" = false ]; then
    echo -e "\n${YELLOW}Step 4: Committing and pushing...${NC}"
    
    # Check for changes
    if git diff --quiet && git diff --cached --quiet; then
        print_info "No changes to commit"
    else
        # Add all changes
        if [ "$DRY_RUN" = false ]; then
            git add -A
        fi
        
        # Generate commit message with AI if not provided
        if [ -z "$CUSTOM_MESSAGE" ] && [ "$AI_ANALYSIS" = true ]; then
            print_ai "Generating commit message..."
            
            # Get more detailed diff for commit message
            DIFF_FOR_COMMIT=$(git diff --staged --stat)
            FILES_CHANGED=$(git diff --staged --name-only | wc -l | tr -d ' ')
            
            COMMIT_PROMPT="Generate a conventional commit message for these changes:

Summary: $CHANGE_SUMMARY
Files changed: $FILES_CHANGED
Diff stats: $DIFF_FOR_COMMIT

Follow conventional commit format (feat/fix/docs/chore/refactor).
Include a clear subject line (50 chars max) and body with bullet points of key changes.
Be specific about what was implemented or fixed."

            COMMIT_MESSAGE=$(get_ai_analysis "$COMMIT_PROMPT" 500)
            
            if [ -n "$COMMIT_MESSAGE" ]; then
                # Add AI attribution
                COMMIT_MESSAGE="$COMMIT_MESSAGE

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
            else
                # Fallback to basic message
                COMMIT_MESSAGE="chore: update codebase

- Updated multiple files
- Cleaned temporary artifacts"
            fi
        elif [ -n "$CUSTOM_MESSAGE" ]; then
            COMMIT_MESSAGE="$CUSTOM_MESSAGE"
        else
            # Basic fallback
            COMMIT_MESSAGE="chore: update codebase"
        fi
        
        # Show what will be committed
        echo -e "\n${BLUE}Commit message:${NC}"
        echo "$COMMIT_MESSAGE"
        
        if [ "$DRY_RUN" = true ]; then
            print_info "DRY RUN: Would commit with above message"
        else
            # Commit changes
            git commit -m "$COMMIT_MESSAGE"
            print_status "Changes committed"
            
            # Push to remote
            CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
            print_info "Pushing to origin/$CURRENT_BRANCH..."
            
            if git push origin "$CURRENT_BRANCH" 2>/dev/null; then
                print_status "Successfully pushed to GitHub"
            else
                print_error "Push failed - you may need to set upstream"
                echo "Run: git push --set-upstream origin $CURRENT_BRANCH"
            fi
        fi
    fi
fi

# Summary
echo -e "\n${GREEN}✅ Process completed!${NC}"
echo -e "${PURPLE}======================================${NC}"

# Show summary
echo -e "\nActions taken:"
[ "$SKIP_CLEANUP" = false ] && echo "  ✓ Temporary artifacts cleaned"
[ "$SKIP_DOCS" = false ] && echo "  ✓ Documentation analyzed and updated"
[ "$SKIP_COMMIT" = false ] && echo "  ✓ Changes committed with AI-generated message"
[ "$AI_ANALYSIS" = true ] && echo "  🤖 AI analysis performed"

# Show final status
if [ "$DRY_RUN" = false ]; then
    echo -e "\n${BLUE}Repository status:${NC}"
    git log --oneline -3
    echo ""
    git status --short
fi

echo -e "\n${PURPLE}🎉 Done with AI assistance!${NC}"