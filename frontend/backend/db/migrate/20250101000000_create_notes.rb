class CreateNotes < ActiveRecord::Migration[7.1]
  def change
    create_table :notes do |t|
      t.string :title, null: false
      t.text :body, null: false, default: ""
      t.string :color, null: false, default: "banana"

      t.timestamps
    end
  end
end
