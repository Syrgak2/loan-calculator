
from django.urls import path
from . import views

urlpatterns = [
    path('calculator/', views.loan_calculator, name='loan_calculator'),
]