from fastapi import FastAPI
from Board import GameState
app = FastAPI()
game = GameState()
class GameState():
    def __init__(self):
        self.board=[
            ["bR","bN","bB","bQ","bK","bB","bN","bR"],
            ["bp","bp","bp","bp","bp","bp","bp","bp"],
            ["--","--","--","--","--","--","--","--"],
            ["--","--","--","--","--","--","--","--"],
            ["wp","wp","wp","wp","wp","wp","wp","wp"],
            ["wR","wN","wB","wQ","wK","wB","wN","wR"]]
        self.whiteToMove=True
        self.moveLog=[]

@app.get("/")
def home():
    return {"message" : "Chess API running"}

@app.get("/board")
def get_board():
    return {"board": game.board}
    
