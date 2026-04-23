import tkinter

class Student:
    def __init__(self, rollNumber, name, age, gender="M"):
        self.rollNumber = rollNumber
        self.name = name
        self.age = age
        self.gender = gender   # Added gender for display


class DataModel:
    def __init__(self):
        self.students = [
            Student(1, "John", 20, "M"),
            Student(2, "Alice", 21, "F"),
            Student(3, "Bob", 22, "M")
        ]

    def getRowCount(self):
        return len(self.students)

    def getColumnCount(self):
        return 4

    def getColumnTitle(self, columnIndex):
        if columnIndex == 0: return "S.No."
        if columnIndex == 1: return "Roll.No."
        if columnIndex == 2: return "Name"
        return "Gender"

    def getColumnWidth(self, columnIndex):
        if columnIndex in (0, 1): return 100
        if columnIndex == 2: return 200
        return 100

    def getValueAt(self, rowIndex, columnIndex):
        s = self.students[rowIndex]
        if columnIndex == 0: return rowIndex + 1
        if columnIndex == 1: return s.rollNumber
        if columnIndex == 2: return s.name
        return "Male" if s.gender == "M" else "Female"


class TMGrid(tkinter.Canvas):
    def __init__(self, parent, model, width, height):
        tkinter.Canvas.__init__(self, parent, width=width, height=height, bg="white")
        self.width = width
        self.height = height
        self.model = model
        self.cell_height = 30
        self.highlight_id = None  # To keep only one highlight
        self.selected_row = None  # Track selected row (for keys)

        # Bind mouse click + key events
        self.bind("<Button-1>", self.gridClicked)
        self.bind("<Up>", self.moveUp)
        self.bind("<Down>", self.moveDown)
        self.bind("<Return>", self.enterPressed)

        # Focus so arrow keys work
        self.focus_set()

        self.drawGrid()

    def gridClicked(self, event):
        x1, y1 = event.x, event.y
        if self.inGrid(x1, y1):
            row = self.getRowClickedOn(y1)
            col = self.getColumnClickedOn(x1)

            if row != -1 and col == 2:  # Name column only
                self.selected_row = row
                self.handleSelection(row)

    def handleSelection(self, row):
        """Handle selection logic: print values + highlight Name cell."""
        name = self.model.getValueAt(row, 2)

        if name == "John":
            print(0)   # John → always 0
        else:
            print(row)  # Alice=1, Bob=2

        # Highlight the full Name cell
        self.highlightSelectedCell(row, 2)

    def moveUp(self, event):
        """Move selection up on Up arrow key."""
        if self.selected_row is None:
            self.selected_row = 0
        else:
            self.selected_row = max(0, self.selected_row - 1)
        self.handleSelection(self.selected_row)

    def moveDown(self, event):
        """Move selection down on Down arrow key."""
        if self.selected_row is None:
            self.selected_row = 0
        else:
            self.selected_row = min(self.model.getRowCount() - 1, self.selected_row + 1)
        self.handleSelection(self.selected_row)

    def enterPressed(self, event):
        """Trigger same action as clicking Name cell with Enter key."""
        if self.selected_row is not None:
            self.handleSelection(self.selected_row)

    def highlightSelectedCell(self, row, col):
        """Highlight the full Name cell with a red outline."""
        if self.highlight_id:
            self.delete(self.highlight_id)

        # Column X position
        x = 10
        for c in range(col):
            x += self.model.getColumnWidth(c)

        # Row Y position
        y = 10 + self.cell_height * (row + 1)

        # Cell width
        col_width = self.model.getColumnWidth(col)

        self.highlight_id = self.create_rectangle(
            x, y, x + col_width, y + self.cell_height,
            outline="red", width=3
        )

    def inGrid(self, x1, y1):
        """Check if the click is within the grid bounds."""
        return 10 <= x1 <= self.width - 10 and 10 <= y1 <= self.height - 10

    def getRowClickedOn(self, y1):
        """Calculate the row based on the y-coordinate of the click."""
        row = (y1 - 10) // self.cell_height - 1
        if 0 <= row < self.model.getRowCount():
            return row
        return -1

    def getColumnClickedOn(self, x1):
        """Calculate the column based on the x-coordinate of the click."""
        x = 10
        for col in range(self.model.getColumnCount()):
            col_width = self.model.getColumnWidth(col)
            if x <= x1 <= x + col_width:
                return col
            x += col_width
        return -1

    def drawGrid(self):
        """Draw the grid with columns and rows."""
        x = 10
        y = 10

        # Column headers
        for col in range(self.model.getColumnCount()):
            col_width = self.model.getColumnWidth(col)
            self.create_rectangle(x, y, x + col_width, y + self.cell_height, fill="#E0E0E0", outline="black")
            self.create_text(x + 5, y + self.cell_height // 2, anchor="w",
                             text=self.model.getColumnTitle(col), font=("Arial", 10, "bold"))
            x += col_width

        # Student rows
        for row in range(self.model.getRowCount()):
            x = 10
            y += self.cell_height
            for col in range(self.model.getColumnCount()):
                col_width = self.model.getColumnWidth(col)
                self.create_rectangle(x, y, x + col_width, y + self.cell_height, outline="black")
                self.create_text(x + 5, y + self.cell_height // 2, anchor="w",
                                 text=self.model.getValueAt(row, col), font=("Arial", 10))
                x += col_width


# --- Main Window ---
model = DataModel()
window = tkinter.Tk()
window.title("Student Data Grid")

grid = TMGrid(window, model, 600, 400)
grid.pack(fill=tkinter.BOTH, expand=True)

window.mainloop()
