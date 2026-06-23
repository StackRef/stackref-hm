class InsufficientFunds(Exception):
    """Exception raised for insufficient funds for a StackCash transaction.

    Attributes:
        message -- explanation of the error
    """

    def __init__(self, message=f"Insufficient StackCash for transaction"):
        self.message = message
        super().__init__(self.message)
