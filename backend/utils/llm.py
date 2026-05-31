import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize the Groq client with the fixed library version
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_rfp_answer(question: str, context_chunks: list, conversation_history: list = None):
    """
    Combines RFP context with a user question to generate an AI response.
    Supports multi-turn conversation via conversation_history.
    """
    if context_chunks and isinstance(context_chunks[0], dict):
        context_text = "\n\n".join([f"Source ({c.get('filename')}):\n{c.get('text')}" for c in context_chunks])
    else:
        context_text = "\n\n".join(context_chunks)
    
    prompt = f"""
    You are an expert RFP (Request for Proposal) assistant. 
    Use the following pieces of retrieved context to answer the user's question.
    If you don't know the answer based on the context, say that you don't know.
    When answering, always mention which part of the context the information came from. If multiple documents are provided, refer to them by their content.
    
    CONTEXT:
    {context_text}
    
    QUESTION:
    {question}
    
    ANSWER:
    """

    # Build the messages array with system prompt first
    messages = [
        {"role": "system", "content": "You are a professional bid writer and technical analyst."},
    ]

    # Inject past conversation history (after system prompt, before new question)
    if conversation_history:
        messages.extend(conversation_history)

    # Add the new user question with context
    messages.append({"role": "user", "content": prompt})

    chat_completion = client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
    )
    
    return chat_completion.choices[0].message.content