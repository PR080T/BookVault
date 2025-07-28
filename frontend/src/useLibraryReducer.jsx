export const initialState = {  // Export for use in other modules
    books: null,
  };
  
export const actionTypes = {  // Export for use in other modules
BOOKS: "BOOKS",
};
  
const reducer = (state, action) => {
    switch (action.type) {
        case actionTypes.BOOKS:
        return {
            ...state,
            books: action.books,
        };

        default:
        return state;
    }
};
  
export default reducer;  // Export for use in other modules
