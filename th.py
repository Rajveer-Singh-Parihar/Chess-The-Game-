from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

# ✅ Mount static files (VERY IMPORTANT)
app.mount("/static", StaticFiles(directory="public"), name="static")


# ✅ Game State Class
class GameState:
    def __init__(self):
        self.board = [
            ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
            ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
            ["--", "--", "--", "--", "--", "--", "--", "--"],
            ["--", "--", "--", "--", "--", "--", "--", "--"],
            ["--", "--", "--", "--", "--", "--", "--", "--"],
            ["--", "--", "--", "--", "--", "--", "--", "--"],
            ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
            ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
        ]


# ✅ Create game instance
game = GameState()


# ✅ Home route → loads HTML
@app.get("/")
def home():
    return FileResponse("public/index.html")


# ✅ API route → send board data
@app.get("/board")
def get_board():
    return {"board": game.board}
