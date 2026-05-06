class Note < ApplicationRecord
  COLORS = %w[banana bubblegum mint sky lavender peach].freeze

  validates :title, presence: true, length: { maximum: 80 }
  validates :body, length: { maximum: 1_000 }
  validates :color, inclusion: { in: COLORS }

  before_validation :set_defaults

  private

  def set_defaults
    self.title = "Untitled sparkle" if title.blank?
    self.body = "" if body.nil?
    self.color = COLORS.sample if color.blank?
  end
end
