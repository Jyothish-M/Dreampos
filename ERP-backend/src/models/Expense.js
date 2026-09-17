import mongoose from mongoose;

const expenseSchema = new mongoose.Schema(
{
    reference:{type:String,unique:true},
    title:{type:String,required:true},
    amount:{type:Number,required:true},
    category:{type:String,required:true},
    date:{type:Date,required:true},
    description:{type:String,required:true},
    status: { type: String,enum:['Approved','Pending'], default: "Approved" },

},{timestamps:true}
);
expenseSchema.pre("save", function (next) {
  if (!this.reference) {
    this.reference = "EXP-" + Date.now().toString().slice(-6);
  }
  next();
});

export default mongoose.model("Expense", expenseSchema);