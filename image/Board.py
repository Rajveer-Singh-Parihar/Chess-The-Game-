import tkinter
class ChessBoard(tkinter.Tk):
    def __init__(self):
        tkinter.Tk.__init__(self)
        self.title("Chess The Game")
        self.canvas = tkinter.Canvas(self, width=700, height=700)
        self.canvas.grid(row=0, column=0)
        self.board = self.createBoardDataStructure()
        self.loadPieces()
        self.initializeNewGame()
        self.updateBoard()
        self.canvas.bind("<Button-1>", self.onChessBoardClicked)
    
    def createBoardDataStructure(self):
        board = list()
        for x in range(8):
            board.append(list())
            for y in range(8):
                board[x].append(None)
        return board
    
    def loadPieces(self):
        self.pieces = {}
        self.pieces["wp"] = tkinter.PhotoImage(file="Chess The Game/image/wp.png")
        self.pieces["wr"] = tkinter.PhotoImage(file="Chess The Game/image/wr.png")
        self.pieces["wn"] = tkinter.PhotoImage(file="Chess The Game/image/wn.png")
        self.pieces["wb"] = tkinter.PhotoImage(file="Chess The Game/image/wb.png")
        self.pieces["wq"] = tkinter.PhotoImage(file="Chess The Game/image/wq.png")
        self.pieces["wk"] = tkinter.PhotoImage(file="Chess The Game/image/wk.png")
        self.pieces["bp"] = tkinter.PhotoImage(file="Chess The Game/image/bp.png")
        self.pieces["br"] = tkinter.PhotoImage(file="Chess The Game/image/br.png")
        self.pieces["bn"] = tkinter.PhotoImage(file="Chess The Game/image/bn.png")
        self.pieces["bb"] = tkinter.PhotoImage(file="Chess The Game/image/bb.png")
        self.pieces["bq"] = tkinter.PhotoImage(file="Chess The Game/image/bq.png")
        self.pieces["bk"] = tkinter.PhotoImage(file="Chess The Game/image/bk.png")

    def initializeNewGame(self):
        # Clear the board first
        for x in range(8):
            for y in range(8):
                self.board[x][y] = None
        
        # Set up black pieces (top of the board)
        self.board[0][0] = "br"  # Black rook
        self.board[0][1] = "bn"  # Black knight
        self.board[0][2] = "bb"  # Black bishop
        self.board[0][3] = "bq"  # Black queen
        self.board[0][4] = "bk"  # Black king
        self.board[0][5] = "bb"  # Black bishop
        self.board[0][6] = "bn"  # Black knight
        self.board[0][7] = "br"  # Black rook
        
        # Set up black pawns
        for i in range(8):
            self.board[1][i] = "bp"  # Black pawns
        
        # Set up white pieces (bottom of the board)
        self.board[7][0] = "wr"  # White rook
        self.board[7][1] = "wn"  # White knight
        self.board[7][2] = "wb"  # White bishop
        self.board[7][3] = "wq"  # White queen
        self.board[7][4] = "wk"  # White king
        self.board[7][5] = "wb"  # White bishop
        self.board[7][6] = "wn"  # White knight
        self.board[7][7] = "wr"  # White rook
        
        # Set up white pawns
        for i in range(8):
            self.board[6][i] = "wp"  # White pawns
        
    def updateBoard(self):
        ycor = 0
        for x in range(8):
            xcor =0
            for y in range(8):
                if y%2==0:
                    if x%2==0:
                        self.canvas.create_rectangle(xcor, ycor, xcor+75, ycor+75, fill="white",width=0)
                    else:
                        self.canvas.create_rectangle(xcor, ycor, xcor+75, ycor+75, fill="gray",width=0)
                else:
                    if x%2==0:
                        self.canvas.create_rectangle(xcor, ycor, xcor+75, ycor+75, fill="gray",width=0)
                    else:
                        self.canvas.create_rectangle(xcor, ycor, xcor+75, ycor+75, fill="white",width=0)
                if self.board[x][y] != None:
                    self.canvas.create_image(xcor, ycor, image=self.pieces[self.board[x][y]],anchor="nw")
                xcor+=75
            ycor+=75

    def onChessBoardClicked(self, event):
        #print(f"({event.x}, {event.y})")
        row=self.getBoardY(event.y)
        column=self.getBoardX(event.x)
        print(f"({row}, {column})")

    def getBoardX(self,mouseX):
        xc=0
        for x in range(8):
            if mouseX>xc and mouseX<xc+74:return x
            xc+=75
        return -1
    
    def getBoardY(self,mouseY):
        yc=0
        for y in range(8):
            if mouseY>yc and mouseY<yc+74:return y
            yc+=75
        return -1

cb = ChessBoard()
cb.mainloop()