const initialState = {
    user: {}
 };
 const reducer = (state = initialState, action) => {
    switch (action.type) {
       case 'SAVE_USER':
          return Object.assign({}, state, {
             user: action.payload
          })
       default:
          return state;
    }
 }
 export default reducer;