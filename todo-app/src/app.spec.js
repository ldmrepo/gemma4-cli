import { test, expect } from '@playwright/test';

test.describe('마크다운 메모 앱 테스트', () => {
  test('페이지 로드 및 기본 UI 확인', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // 제목 확인
    await expect(page).toHaveTitle(/마크다운|Markdown/);
    
    // 헤더 확인
    await expect(page.locator('.app-header h1')).toBeVisible();
    await expect(page.locator('.btn-primary')).toHaveText('+ New Note');
  });
  
  test('사이드바 요소 확인', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // 탐색기 확인
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.search-box input')).toBeVisible();
    await expect(page.locator('.tags-section')).toBeVisible();
  });
  
  test('편집기 패널 확인', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // 편집기 패널 확인
    await expect(page.locator('.editor-panel')).toBeVisible();
    await expect(page.getByPlaceholder('Title')).toBeVisible();
    await expect(page.getByPlaceholder('Write in Markdown...')).toBeVisible();
    await expect(page.getByPlaceholder('Tags (comma-separated)')).toBeVisible();
  });
  
  test('노트 목록과 에디터 레이아웃', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // 모든 주요 영역 확인
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
    
    // 영역이 가로로 배치되었는지 확인 (flexbox)
    const flexDirection = await mainContent.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    expect(flexDirection).toBe('row');
  });
  
  test('API 엔드포인트 응답 확인', async ({ page }) => {
    const response = await page.goto('http://localhost:3001/api/notes');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
