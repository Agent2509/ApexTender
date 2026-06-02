class SemanticChunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap
        
    def chunk_text(self, text: str, page_num: int, section: str = "general") -> list[dict]:
        """ME CHOP BIG ROCK INTO SMALL ROCKS (CHUNKS) WITH OVERLAP SO WORDS NO BREAK BADLY"""
        if not text:
            return []
            
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            
            # ME TRY TO NOT CHOP WORD IN HALF
            if end < text_length:
                last_space = text.rfind(' ', start, end)
                if last_space != -1 and last_space > start + self.chunk_size // 2:
                    end = last_space
                    
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({
                    "text": chunk_text,
                    "metadata": {
                        "page_num": page_num,
                        "section": section
                    }
                })
                
            start = end - self.overlap
            
        return chunks
