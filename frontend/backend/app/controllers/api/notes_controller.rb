module Api
  class NotesController < ApplicationController
    before_action :set_note, only: %i[update destroy]

    def index
      render json: Note.order(created_at: :desc)
    end

    def create
      note = Note.new(note_params)

      if note.save
        render json: note, status: :created
      else
        render json: { errors: note.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @note.update(note_params)
        render json: @note
      else
        render json: { errors: @note.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @note.destroy!
      head :no_content
    end

    private

    def set_note
      @note = Note.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Note not found" }, status: :not_found
    end

    def note_params
      params.require(:note).permit(:title, :body, :color)
    end
  end
end
