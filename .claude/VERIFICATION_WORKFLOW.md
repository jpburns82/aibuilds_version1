# Claude Verification Workflow

## MANDATORY CHECKS BEFORE DECLARING WORK COMPLETE

### 1. TypeScript Compilation Check
```bash
# Backend
cd /mnt/c/Users/jesse/Desktop/app\ projects/aibuilds_version1 && npx tsc --noEmit

# Frontend
cd /mnt/c/Users/jesse/Desktop/app\ projects/aibuilds_version1/ui && npx tsc --noEmit
```

### 2. Runtime Verification
- Start backend server and verify no crashes
- Start frontend server and verify no crashes
- Test critical API endpoints with curl

### 3. Code Verification Checklist
- [ ] All new files < 300 lines
- [ ] No unused imports causing errors
- [ ] All imports resolve correctly
- [ ] No circular dependencies
- [ ] All exported functions are used or intentionally public API

### 4. Functional Verification
- [ ] Test the specific feature being implemented
- [ ] Verify integration with existing systems
- [ ] Check UI renders correctly (if applicable)

### 5. Documentation
- [ ] Update relevant .md files
- [ ] Comment complex logic
- [ ] Update PROJECT_MASTER_STATUS.md

### 6. Git Workflow
```bash
git status
git diff
git add -A
git commit -m "descriptive message"
git push origin main
```

## SESSION START CHECKLIST
1. Read PROJECT_MASTER_STATUS.md
2. Check current git status
3. Verify servers can start without errors
4. Review TODO list from previous session

## FACT VERIFICATION RULES
- Never assume code exists - always verify with Grep/Glob/Read
- Test API endpoints directly before claiming they work
- Check actual file contents, not memory of what was written
- Verify imports match actual export names in source files
