import mmap
import gc
import time
from pypdf import PdfReader

class MemorySafeParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        
    def _is_tabular_page(self, text: str) -> bool:
        """ME COUNT STICKS TO FIND TABLES"""
        if not text:
            return False
        
        pipe_count = text.count('|')
        dash_count = text.count('-')
        
        # IF MANY STICKS, IT BE TABLE
        if pipe_count > 10 or dash_count > 20:
            return True
        return False
        
    def _offload_to_llamaparse_with_backoff(self, page_num: int, text: str):
        """ME WAIT SO BIG LLAMA NOT MAD (20 RPM / 50 QPS)"""
        max_retries = 5
        base_delay = 3.0  # 3 SECONDS = 20 REQUESTS PER MINUTE MAX
        
        for attempt in range(max_retries):
            try:
                # ME SEND SMOKE SIGNAL TO LLAMA PARSE
                # response = requests.post("...", data=text)
                # if response.status == 429: raise Exception("TOO FAST")
                
                # PRETEND ME SEND
                time.sleep(base_delay)
                return True
            except Exception as e:
                # ME WAIT LONGER IF LLAMA MAD
                delay = base_delay * (2 ** attempt)
                time.sleep(delay)
                
        return False

    def parse(self) -> str:
        \"\"\"ME READ ROCK WITH MAGIC WINDOW (MMAP) AND CLEAN UP (GC)\"\"\"
        extracted_text = []
        with open(self.file_path, "rb") as f:
            with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as mm:
                reader = PdfReader(mm)
                num_pages = len(reader.pages)
                
                for i in range(num_pages):
                    page = reader.pages[i]
                    text = page.extract_text()
                    
                    if self._is_tabular_page(text):
                        self._offload_to_llamaparse_with_backoff(i, text)
                    else:
                        # NORMAL READING, ME DO NOTHING FOR NOW
                        pass
                        
                    if text:
                        extracted_text.append(text)
                        
                    # MAGIC GARBAGE MAN COME EVERY 50 PAGES (OOM SAFE)
                    if (i + 1) % 50 == 0:
                        gc.collect()
                        
                # FINAL GARBAGE SWEEP
                gc.collect()
        return "\n".join(extracted_text)
