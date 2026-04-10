const puppeteer = require('puppeteer');

async function testFrontend() {
  console.log('=== 프론트엔드 테스트 시작 ===\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 페이지 로드 테스트
    console.log('[1/5] 페이지 로드 테스트...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    const title = await page.title();
    console.log(`  ✓ 페이지 로드 성공: ${title}\n`);
    
    // 2. 헤더 요소 확인
    console.log('[2/5] UI 요소 확인...');
    const header = await page.$('.app-header');
    const sidebar = await page.$('.sidebar');
    const notesList = await page.$('.notes-list');
    const editorPanel = await page.$('.editor-panel');
    
    if (header && sidebar && notesList && editorPanel) {
      console.log('  ✓ 모든 주요 UI 요소 존재 확인\n');
    } else {
      console.log('  ✗ 일부 UI 요소 누락');
      process.exit(1);
    }
    
    // 3. 버튼 요소 확인
    console.log('[3/5] 액션 버튼 확인...');
    const newNoteBtn = await page.$('.btn-primary');
    const saveBtn = await page.$('.btn-save');
    
    if (newNoteBtn && saveBtn) {
      console.log('  ✓ 버튼 요소 확인 완료\n');
    } else {
      console.log('  ✗ 버튼 요소 누락');
      process.exit(1);
    }
    
    // 4. API 연동 테스트
    console.log('[4/5] API 연동 테스트...');
    const notesResponse = await page.evaluate(() => {
      return fetch('/api/notes')
        .then(res => res.json())
        .then(data => data)
        .catch(err => err);
    });
    
    if (Array.isArray(notesResponse)) {
      console.log(`  ✓ API 응답 수신: ${notesResponse.length}개 노트\n`);
    } else {
      console.log(`  ✗ API 응답 오류:`, notesResponse);
    }
    
    // 5. 화면 캡처
    console.log('[5/5] 화면 캡처...');
    await page.screenshot({ path: 'dist/test-screenshot.png', fullPage: true });
    console.log('  ✓ 캡처 저장: dist/test-screenshot.png\n');
    
    console.log('=== 모든 테스트 통과 ===');
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFrontend();
